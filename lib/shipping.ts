import {
  getShippingRates as getSendboxRates,
  createShipment as createSendboxShipment,
  SendboxAddress,
  SendboxItemInput,
} from './sendbox';
import { ShipbubbleService, AddressInput as ShipbubbleAddress } from './shipbubble';

export type ShippingProvider = 'sendbox' | 'shipbubble';

export interface UnifiedShippingRate {
  id: string; // "<provider>:<providerNativeId>"
  provider: ShippingProvider;
  courier: string;
  service_type: string;
  estimated_days: number;
  amount: number;
  currency: string;
  rating?: {
    score: number;
    votes: number;
    trackingLabel: string;
  };
}

export interface UnifiedItemInput {
  name: string;
  quantity: number;
  weight?: number;      // kg
  dimensions?: string;  // "LxWxH" cm, used by Sendbox only
  price?: number;       // unit price, NGN
}

export interface UnifiedAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country?: string;
}

/**
 * List of Nigerian states for the shipping address form dropdown.
 */
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
].map(name => ({ name }));

function toSendboxItems(items: UnifiedItemInput[]): SendboxItemInput[] {
  return items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    weight: i.weight != null ? String(i.weight) : undefined,
    dimensions: i.dimensions,
    price: i.price,
  }));
}

function toShipbubbleItems(items: UnifiedItemInput[]) {
  return items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    weight: i.weight,
    price: i.price,
  }));
}

function toSendboxAddress(a: UnifiedAddress): SendboxAddress {
  return { name: a.name, email: a.email, phone: a.phone, address: a.address, city: a.city, state: a.state, country: a.country };
}

function toShipbubbleAddress(a: UnifiedAddress): ShipbubbleAddress {
  return { name: a.name, email: a.email, phone: a.phone, address: a.address, city: a.city, state: a.state, country: a.country };
}

/**
 * Calls Sendbox and Shipbubble in parallel and merges their rates into one
 * sorted (cheapest-first) list. One provider failing does not block the
 * other's rates from showing.
 */
export async function getMergedShippingRates(
  destination: UnifiedAddress,
  items: UnifiedItemInput[]
): Promise<UnifiedShippingRate[]> {
  const [sendboxResult, shipbubbleResult] = await Promise.allSettled([
    getSendboxRates(toSendboxAddress(destination), toSendboxItems(items)),
    ShipbubbleService.getShippingRates(toShipbubbleAddress(destination), toShipbubbleItems(items)),
  ]);

  const rates: UnifiedShippingRate[] = [];

  if (sendboxResult.status === 'fulfilled') {
    for (const r of sendboxResult.value) {
      rates.push({
        id: `sendbox:${r.id}`,
        provider: 'sendbox',
        courier: r.courier,
        service_type: r.service_type,
        estimated_days: r.estimated_days,
        amount: r.amount,
        currency: r.currency,
      });
    }
  } else {
    console.error('[Shipping] Sendbox rates failed:', sendboxResult.reason);
  }

  if (shipbubbleResult.status === 'fulfilled') {
    if (shipbubbleResult.value.success) {
      for (const r of shipbubbleResult.value.rates) {
        // Skip Sendbox-brokered entries from Shipbubble to avoid reseller markup & duplicate options
        if (r.courier_name.toLowerCase().includes('sendbox')) {
          continue;
        }

        rates.push({
          id: `shipbubble:${r.courier_id || r.shipping_option_id}`,
          provider: 'shipbubble',
          courier: r.courier_name,
          service_type: r.delivery_eta,
          estimated_days: parseInt(r.delivery_eta, 10) || 3,
          amount: r.total_shipping_fee,
          currency: 'NGN',
          rating: r.ratings != null ? {
            score: r.ratings,
            votes: r.votes || 0,
            trackingLabel: r.trackingLabel || 'Good',
          } : undefined,
        });
      }
    } else {
      console.warn('[Shipping] Shipbubble returned no rates:', shipbubbleResult.value.message);
    }
  } else {
    console.error('[Shipping] Shipbubble rates failed:', shipbubbleResult.reason);
  }

  return rates.sort((a, b) => a.amount - b.amount);
}

/**
 * Books a shipment through whichever provider the customer's chosen rate
 * came from, based on the "<provider>:<id>" prefix set in getMergedShippingRates.
 */
export async function createShipmentFromRate(
  rate: UnifiedShippingRate,
  orderId: string,
  destination: UnifiedAddress,
  items: UnifiedItemInput[]
): Promise<{ success: boolean; shipmentId?: string; trackingCode?: string; message?: string }> {
  const separatorIndex = rate.id.indexOf(':');
  const realId = separatorIndex >= 0 ? rate.id.slice(separatorIndex + 1) : rate.id;

  if (rate.provider === 'sendbox') {
    try {
      const shipment = await createSendboxShipment({
        rateId: realId,
        orderId,
        destination: toSendboxAddress(destination),
        items: toSendboxItems(items),
      });
      return { success: true, shipmentId: shipment.shipment_id, trackingCode: shipment.tracking_number };
    } catch (err: any) {
      return { success: false, message: err.message || 'Sendbox booking failed' };
    }
  }

  if (rate.provider === 'shipbubble') {
    return ShipbubbleService.createShipment(
      orderId,
      toShipbubbleAddress(destination),
      realId,
      toShipbubbleItems(items)
    );
  }

  return { success: false, message: `Unknown shipping provider: ${rate.provider}` };
}
