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
   * Helper to get sender address code.
   */
  private static async getSenderAddressCode(): Promise<number> {
    const senderIdEnv = process.env.SHIPBUBBLE_SENDER_ADDRESS_ID || process.env.SHIPBUBBLE_SENDER_ADDRESS_CODE;
    if (senderIdEnv && /^\d+$/.test(senderIdEnv.trim())) {
      return parseInt(senderIdEnv.trim(), 10);
    }

    console.warn(
      "SHIPBUBBLE_SENDER_ADDRESS_ID is not configured. Validating store address..."
    );

    const code = await this.validateAddress({
      name: process.env.STORE_NAME || "Beyond Realms Store",
      email: process.env.BREVO_SENDER_EMAIL || "support@beyondrealmsltd.com",
      phone: process.env.STORE_PHONE || "08030000000",
      address: process.env.STORE_ADDRESS || "Nos 8, Ademola Babalola idi-Igbabo",
      city: process.env.STORE_CITY || "Ogbomoso",
      state: process.env.STORE_STATE || "Oyo",
      country: "Nigeria",
    });

    if (!code) {
      throw new Error("Failed to validate store sender address. Check Shipbubble credentials and connectivity.");
    }
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
   */
  static async getShippingRates(
    deliveryAddress: AddressInput,
    items: Array<{ name: string; quantity: number; weight?: number; price?: number }>
  ): Promise<RequestRatesResponse> {
    try {
      const baseUrl = this.getBaseUrl();
      const senderAddressCode = await this.getSenderAddressCode();
      const receiverAddressCode = await this.validateAddress(deliveryAddress);

      if (!receiverAddressCode) {
        return {
          success: false,
          rates: [],
          message: "Could not validate delivery address. Please ensure street, city, state, and country are correct.",
        };
      }

      const payload = this.buildRatesPayload(senderAddressCode, receiverAddressCode, items);

      const response = await fetch(`${baseUrl}/shipping/fetch_rates`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      console.log("[Shipbubble Rates Response]:", JSON.stringify(json));

      if (json.status !== "success" || !json.data || !json.data.couriers) {
        return {
          success: false,
          rates: [],
          message: json.message || "Failed to fetch rates from Shipbubble",
        };
      }

      const rates: ShipbubbleRate[] = json.data.couriers.map((courier: any) => ({
        courier_id: String(courier.courier_id || courier.service_code),
        courier_name: courier.courier_name,
        courier_image: courier.courier_image,
        total_shipping_fee: Number(courier.total || courier.rate_card_amount || 0),
        delivery_eta: courier.delivery_eta || "2-5 days",
        shipping_option_id: String(courier.courier_id || courier.service_code),
        ratings: typeof courier.ratings === 'number' ? courier.ratings : undefined,
        votes: typeof courier.votes === 'number' ? courier.votes : undefined,
        trackingLabel: courier.tracking?.label || undefined,
      }));

      return {
        success: true,
        rates,
      };
    } catch (error: any) {
      console.error("Error getting Shipbubble rates:", error);
      return {
        success: false,
        rates: [],
        message: error.message || "An unexpected error occurred while fetching shipping rates",
      };
    }
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
