import crypto from "crypto";

export interface AddressInput {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
}

export interface ShipbubbleRate {
  courier_id: string;
  courier_name: string;
  courier_image?: string;
  total_shipping_fee: number;
  delivery_eta: string;
  shipping_option_id: string;
  ratings?: number;
  votes?: number;
  trackingLabel?: string;
}

export interface RequestRatesResponse {
  success: boolean;
  rates: ShipbubbleRate[];
  message?: string;
}

export class ShipbubbleService {
  /**
   * Module-level in-process cache for the sender address code.
   * Starts as null; populated on first successful validation.
   * Cleared automatically if Shipbubble rejects it, triggering re-validation.
   */
  private static cachedSenderCode: number | null = null;

  private static getHeaders() {
    const apiKey = process.env.SHIPBUBBLE_API_KEY;
    if (!apiKey) {
      console.warn("SHIPBUBBLE_API_KEY is not set in environment variables.");
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey || ""}`,
    };
  }

  private static getBaseUrl() {
    const envUrl = process.env.SHIPBUBBLE_BASE_URL || process.env.SHIPBUBBLE_API_URL;
    if (envUrl && !envUrl.includes("api-test")) {
      return envUrl;
    }
    return "https://api.shipbubble.com/v1";
  }

  /**
   * Helper to validate addresses and retrieve the address code.
   */
  static async validateAddress(address: AddressInput): Promise<number | null> {
    try {
      const baseUrl = this.getBaseUrl();
      const countryStr = address.country || "Nigeria";

      // Shipbubble requires a full name (2+ words, letters only, no numbers or symbols)
      let cleanName = (address.name || "Customer User").replace(/[^a-zA-Z\s]/g, "").trim();
      if (!cleanName.includes(" ")) {
        cleanName = `${cleanName} User`;
      }

      let addressString = address.address;
      if (!addressString.toLowerCase().includes(countryStr.toLowerCase())) {
        addressString = `${addressString}, ${address.city}, ${address.state}, ${countryStr}`;
      }

      const response = await fetch(`${baseUrl}/shipping/address/validate`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: cleanName,
          email: address.email || "customer@example.com",
          phone: address.phone,
          address: addressString,
        }),
      });

      const json = await response.json();
      console.log(`[Shipbubble Address Validate] (${addressString}):`, JSON.stringify(json));

      if (json.status === "success" && json.data && json.data.address_code) {
        return Number(json.data.address_code);
      }

      return null;
    } catch (error) {
      console.error("Error validating address with Shipbubble:", error);
      return null;
    }
  }

  /**
   * Returns the sender address code, preferring the in-process cache.
   * Falls back to the SHIPBUBBLE_SENDER_ADDRESS_CODE env var, then performs
   * a live address validation as a last resort. The resolved value is cached
   * for the lifetime of the server process.
   */
  private static async getSenderAddressCode(): Promise<number> {
    // 1. In-process cache (fastest path — avoids any network call on repeat requests)
    if (this.cachedSenderCode !== null) {
      return this.cachedSenderCode;
    }

    // 2. Env var (useful for first cold-start without prior validation)
    const envCode = process.env.SHIPBUBBLE_SENDER_ADDRESS_ID || process.env.SHIPBUBBLE_SENDER_ADDRESS_CODE;
    if (envCode && /^\d+$/.test(envCode.trim())) {
      this.cachedSenderCode = parseInt(envCode.trim(), 10);
      return this.cachedSenderCode;
    }

    // 3. Live validation as final fallback
    return this.freshValidateSenderAddress();
  }

  /**
   * Always performs a live Shipbubble address validation for the store address
   * and updates the in-process cache. Called automatically when the cached/env
   * code is rejected by the API.
   */
  private static async freshValidateSenderAddress(): Promise<number> {
    console.warn('[Shipbubble] Re-validating store sender address (cache miss or stale code)...');
    const code = await this.validateAddress({
      name:    process.env.STORE_NAME    || 'Beyond Realms Store',
      email:   process.env.BREVO_SENDER_EMAIL || 'support@beyondrealmsltd.com',
      phone:   process.env.STORE_PHONE   || '08030000000',
      address: `${process.env.STORE_ADDRESS || 'Nos 8, Ademola Babalola idi-Igbabo'}, ${process.env.STORE_CITY || 'Ibadan'}, ${process.env.STORE_STATE || 'Oyo'}, Nigeria`,
      city:    process.env.STORE_CITY    || 'Ibadan',
      state:   process.env.STORE_STATE   || 'Oyo',
      country: 'Nigeria',
    });

    if (!code) {
      throw new Error('Failed to validate store sender address with Shipbubble. Check API key and store address.');
    }

    this.cachedSenderCode = code;
    console.log(`[Shipbubble] Sender address re-validated. New code: ${code}`);
    return code;
  }


  private static buildRatesPayload(
    senderAddressCode: number,
    receiverAddressCode: number,
    items: Array<{ name: string; quantity: number; weight?: number; price?: number }>
  ) {
    return {
      sender_address_code: senderAddressCode,
      reciever_address_code: receiverAddressCode,
      pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      category_id: 74794423, // Fashion wears / general merchandise
      package_items: items.map(item => ({
        name: item.name,
        description: item.name,
        quantity: item.quantity,
        unit_amount: item.price ?? 2000,
        unit_weight: item.weight || 0.5,
      })),
      package_dimension: {
        length: 10,
        width: 10,
        height: 10,
      },
    };
  }

  /**
   * Fetches real-time shipping rates from Shipbubble courier partners.
   * Automatically self-heals if the cached sender address code is stale:
   * it re-validates the store address and retries the fetch exactly once.
   */
  static async getShippingRates(
    deliveryAddress: AddressInput,
    items: Array<{ name: string; quantity: number; weight?: number; price?: number }>
  ): Promise<RequestRatesResponse> {
    try {
      return await this._fetchRates(deliveryAddress, items);
    } catch (error: any) {
      console.error('[Shipbubble] getShippingRates error:', error);
      return {
        success: false,
        rates: [],
        message: error.message || 'An unexpected error occurred while fetching shipping rates',
      };
    }
  }

  /** Internal: performs the actual rates fetch, with one automatic retry on stale sender code. */
  private static async _fetchRates(
    deliveryAddress: AddressInput,
    items: Array<{ name: string; quantity: number; weight?: number; price?: number }>,
    isRetry = false
  ): Promise<RequestRatesResponse> {
    const baseUrl = this.getBaseUrl();
    const senderAddressCode = await this.getSenderAddressCode();
    const receiverAddressCode = await this.validateAddress(deliveryAddress);

    if (!receiverAddressCode) {
      return {
        success: false,
        rates: [],
        message: 'Could not validate delivery address. Please ensure street, city, state, and country are correct.',
      };
    }

    const payload = this.buildRatesPayload(senderAddressCode, receiverAddressCode, items);

    const response = await fetch(`${baseUrl}/shipping/fetch_rates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    console.log('[Shipbubble Rates Response]:', JSON.stringify(json));

    // ── Self-healing: stale sender address code ──────────────────────────────
    // Shipbubble returns status "failed" with this exact message when the
    // sender_address_code is expired or unrecognised. Bust the cache,
    // re-validate live, and retry — but only once to avoid infinite loops.
    const isStaleCode =
      json.status === 'failed' &&
      typeof json.message === 'string' &&
      json.message.toLowerCase().includes('invalid sender address code');

    if (isStaleCode && !isRetry) {
      console.warn('[Shipbubble] Sender address code rejected — busting cache and retrying...');
      this.cachedSenderCode = null;           // clear stale cache
      await this.freshValidateSenderAddress(); // re-validate and re-populate cache
      return this._fetchRates(deliveryAddress, items, true); // retry once
    }

    if (json.status !== 'success' || !json.data || !json.data.couriers) {
      return {
        success: false,
        rates: [],
        message: json.message || 'Failed to fetch rates from Shipbubble',
      };
    }

    const rates: ShipbubbleRate[] = json.data.couriers.map((courier: any) => ({
      courier_id:         String(courier.courier_id || courier.service_code),
      courier_name:       courier.courier_name,
      courier_image:      courier.courier_image,
      total_shipping_fee: Number(courier.total || courier.rate_card_amount || 0),
      delivery_eta:       courier.delivery_eta || '2-5 days',
      shipping_option_id: String(courier.courier_id || courier.service_code),
      ratings:            typeof courier.ratings === 'number' ? courier.ratings : undefined,
      votes:              typeof courier.votes   === 'number' ? courier.votes   : undefined,
      trackingLabel:      courier.tracking?.label || undefined,
    }));

    return { success: true, rates };
  }


  /**
   * Books a shipment / creates an order in Shipbubble.
   */
  static async createShipment(
    orderNumber: string,
    deliveryAddress: AddressInput,
    shippingOptionId: string,
    items: Array<{ name: string; quantity: number; weight?: number; price?: number }>
  ): Promise<{ success: boolean; shipmentId?: string; trackingCode?: string; message?: string }> {
    try {
      const baseUrl = this.getBaseUrl();
      const senderAddressCode = await this.getSenderAddressCode();
      const receiverAddressCode = await this.validateAddress(deliveryAddress);

      if (!receiverAddressCode) {
        throw new Error("Could not validate delivery address for shipment creation.");
      }

      const payload = this.buildRatesPayload(senderAddressCode, receiverAddressCode, items);

      const ratesResponse = await fetch(`${baseUrl}/shipping/fetch_rates`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!ratesResponse.ok) {
        const errorText = await ratesResponse.text();
        throw new Error(`Failed to retrieve rate token for booking: ${errorText}`);
      }

      const ratesJson = await ratesResponse.json();
      if (ratesJson.status !== "success" || !ratesJson.data || !ratesJson.data.request_token) {
        throw new Error("Invalid rate token response from Shipbubble");
      }

      const requestToken = ratesJson.data.request_token;

      const courier = ratesJson.data.couriers.find(
        (c: any) => String(c.courier_id) === shippingOptionId
      ) ?? ratesJson.data.couriers.find(
        (c: any) => String(c.service_code) === shippingOptionId
      );

      if (!courier) {
        return {
          success: false,
          message: "Selected shipping option is no longer available — please refresh shipping rates and try again.",
        };
      }

      const response = await fetch(`${baseUrl}/shipping/labels`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          request_token: requestToken,
          service_code: courier.service_code,
          courier_id: courier.courier_id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shipbubble create shipment label failed:", errorText);
        throw new Error(`Shipbubble API error: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.status !== "success" || !json.data) {
        return {
          success: false,
          message: json.message || "Failed to book shipment in Shipbubble",
        };
      }

      return {
        success: true,
        shipmentId: json.data.order_id,
        trackingCode: json.data.order_id,
      };
    } catch (error: any) {
      console.error("Error creating Shipbubble shipment:", error);
      return {
        success: false,
        message: error.message || "An unexpected error occurred while booking the shipment",
      };
    }
  }

  /**
   * Securely verifies if a webhook request actually came from Shipbubble.
   */
  static verifyWebhookSignature(rawBodyString: string, signatureHeader: string): boolean {
    try {
      const secretKey = process.env.SHIPBUBBLE_WEBHOOK_SECRET || process.env.SHIPBUBBLE_API_KEY;
      if (!secretKey) {
        console.error("Shipbubble API Key / Webhook Secret is not defined. Cannot verify webhook signature.");
        return false;
      }

      const expected = crypto
        .createHmac("sha512", secretKey)
        .update(rawBodyString)
        .digest();

      const provided = Buffer.from(signatureHeader, "hex");

      if (provided.length !== expected.length) return false;
      return crypto.timingSafeEqual(expected, provided);
    } catch (error) {
      console.error("Error verifying Shipbubble webhook signature:", error);
      return false;
    }
  }
}
