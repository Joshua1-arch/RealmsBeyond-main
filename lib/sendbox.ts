/**
 * Sendbox API Client
 * Handles: rate fetching, shipment creation, shipment tracking
 * Docs: https://developers.sendbox.co
 *
 * Base URL: https://live.sendbox.co  (dashboard ACCESS TOKEN — no "Bearer" prefix)
 *
 * Confirmed endpoints:
 *   POST /shipping/shipment_delivery_quote  — get courier rates
 *   POST /shipping/shipments                — book shipment
 *   GET  /shipping/shipments/:id            — track shipment
 */

const SENDBOX_TOKEN = process.env.SENDBOX_API_TOKEN || '';
const SENDBOX_BASE_URL =
  process.env.SENDBOX_API_URL || 'https://live.sendbox.co';

if (!SENDBOX_TOKEN) {
  console.warn('[Sendbox] SENDBOX_API_TOKEN is not set');
}

// ─────────────────────────────────────────────
// Internal fetch wrapper
// ─────────────────────────────────────────────
async function sendboxFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SENDBOX_BASE_URL}${path}`;
  console.log(`[Sendbox Request] ${options.method || 'GET'} ${url}`);
  if (options.body) console.log(`[Sendbox Body]`, options.body);

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: SENDBOX_TOKEN,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  console.log(`[Sendbox Response ${res.status}]`, text.substring(0, 800));

  if (!res.ok) {
    console.error(`[Sendbox Error ${res.status}]`, text);
    throw new Error(`Sendbox API error ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Sendbox API returned non-JSON response: ${text}`);
  }
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface SendboxAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country?: string;
}

export interface SendboxItemInput {
  weight?: string;
  dimensions?: string;
  quantity: number;
  name: string;
  price?: number;
}

export interface ShippingRate {
  id: string;
  courier: string;
  courier_logo?: string;
  service_type: string;
  estimated_days: number;
  amount: number;
  currency: string;
}

export interface SendboxShipment {
  shipment_id: string;
  tracking_number: string;
  courier: string;
  status: string;
  label_url?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function parseWeight(weightStr?: string): number {
  const w = parseFloat(weightStr || '0.5');
  return isNaN(w) || w <= 0 ? 0.5 : w;
}

function parseDimensions(dimStr?: string) {
  if (!dimStr) return { length: 1, width: 1, height: 1 };
  const parts = dimStr.toLowerCase().split('x').map((p) => parseFloat(p.trim()));
  if (parts.length === 3 && !parts.some(isNaN)) {
    return { length: parts[0], width: parts[1], height: parts[2] };
  }
  return { length: 1, width: 1, height: 1 };
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(' ');
  return { first: parts[0] || fullName, last: parts.slice(1).join(' ') || '' };
}

/** Map Nigerian states to their capitals — used as fallback city when Sendbox has no coverage */
const NG_STATE_CAPITALS: Record<string, string> = {
  'abia': 'Umuahia', 'adamawa': 'Yola', 'akwa ibom': 'Uyo',
  'anambra': 'Awka', 'bauchi': 'Bauchi', 'bayelsa': 'Yenagoa',
  'benue': 'Makurdi', 'borno': 'Maiduguri', 'cross river': 'Calabar',
  'delta': 'Asaba', 'ebonyi': 'Abakaliki', 'edo': 'Benin City',
  'ekiti': 'Ado-Ekiti', 'enugu': 'Enugu', 'fct': 'Abuja',
  'fct (abuja)': 'Abuja', 'abuja': 'Abuja', 'gombe': 'Gombe',
  'imo': 'Owerri', 'jigawa': 'Dutse', 'kaduna': 'Kaduna',
  'kano': 'Kano', 'katsina': 'Katsina', 'kebbi': 'Birnin Kebbi',
  'kogi': 'Lokoja', 'kwara': 'Ilorin', 'lagos': 'Lagos',
  'nasarawa': 'Lafia', 'niger': 'Minna', 'ogun': 'Abeokuta',
  'ondo': 'Akure', 'osun': 'Osogbo', 'oyo': 'Ibadan',
  'plateau': 'Jos', 'rivers': 'Port Harcourt', 'sokoto': 'Sokoto',
  'taraba': 'Jalingo', 'yobe': 'Damaturu', 'zamfara': 'Gusau',
};

/** Store / sender details pulled from env */
const SENDER = {
  name: process.env.STORE_NAME || 'Beyond Realms Store',
  email: process.env.BREVO_SENDER_EMAIL || 'support@beyondrealmsltd.com',
  phone: process.env.STORE_PHONE || '08030000000',
  address: process.env.STORE_ADDRESS || '15 Admiralty Way, Lekki Phase 1',
  city: process.env.STORE_CITY || 'Lekki',
  state: process.env.STORE_STATE || 'Lagos',
  country_code: 'NG',
};

function buildQuoteBody(
  dest: SendboxAddress & { city: string },
  items: Array<{ weight?: string; dimensions?: string; quantity: number; name: string; price?: number }>,
  totalWeight: number,
  maxLength: number,
  maxWidth: number,
  maxHeight: number,
  totalValue: number,
  pickupDateStr: string
) {
  const sender = splitName(SENDER.name);
  const recipient = splitName(dest.name);

  return {
    region: 'NG',
    currency: 'NGN',
    channel_code: 'api',
    service_type: 'local',
    service_code: 'standard',
    package_type: 'general',
    incoming_option: 'pickup',
    pickup_date: pickupDateStr,
    total_value: totalValue,
    weight: totalWeight,
    dimension: { length: maxLength, width: maxWidth, height: maxHeight },

    origin: {
      first_name: sender.first,
      last_name: sender.last,
      name: SENDER.name,
      email: SENDER.email,
      phone: SENDER.phone,
      street: SENDER.address,
      street_line_2: '',
      city: SENDER.city,
      state: SENDER.state,
      country: SENDER.country_code,
      post_code: '',
      lat: null,
      lng: null,
    },

    destination: {
      first_name: recipient.first,
      last_name: recipient.last,
      name: dest.name,
      email: dest.email,
      phone: dest.phone,
      street: dest.address,
      street_line_2: '',
      city: dest.city,
      state: dest.state,
      country: 'NG',
      post_code: '',
      lat: null,
      lng: null,
    },

    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity || 1,
      value: item.price || 1000,
      item_type: 'general',
      hts_code: '',
    })),
  };
}

// ─────────────────────────────────────────────
// 1. Get available shipping rates
//    POST /shipping/shipment_delivery_quote
// ─────────────────────────────────────────────
export async function getShippingRates(
  destination: SendboxAddress,
  items: Array<{
    weight?: string;
    dimensions?: string;
    quantity: number;
    name: string;
    price?: number;
  }>
): Promise<ShippingRate[]> {
  if (!SENDBOX_TOKEN) throw new Error('Sendbox API token not configured');

  let totalWeight = 0;
  let maxLength = 1;
  let maxWidth = 1;
  let maxHeight = 1;
  let totalValue = 0;

  for (const item of items) {
    const qty = item.quantity || 1;
    totalWeight += parseWeight(item.weight) * qty;
    totalValue += (item.price || 1000) * qty;
    const dims = parseDimensions(item.dimensions);
    if (dims.length > maxLength) maxLength = dims.length;
    if (dims.width > maxWidth) maxWidth = dims.width;
    if (dims.height > maxHeight) maxHeight = dims.height;
  }

  if (totalWeight < 0.5) totalWeight = 0.5;

  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 1);
  const pickupDateStr = pickupDate.toISOString().split('T')[0];

  const body = buildQuoteBody(destination, items, totalWeight, maxLength, maxWidth, maxHeight, totalValue, pickupDateStr);

  const response = await sendboxFetch<any>('/shipping/shipment_delivery_quote', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  console.log('[Sendbox Rates] Full response:', JSON.stringify(response));

  const rawQuotes: any[] =
    response?.rates ||
    response?.data?.quotes ||
    response?.quotes ||
    response?.data ||
    (Array.isArray(response) ? response : []);

  if (!rawQuotes.length) {
    console.warn('[Sendbox] No quotes found:', JSON.stringify(response));
    return [];
  }

  return rawQuotes.map((q: any) => ({
    id: q.key || q.rate_card_id || q.id || q.code || String(Math.random()),
    courier: q.name || q.description || 'Sendbox Courier',
    courier_logo: q.courier_logo || q.logo || '',
    service_type: q.description || q.code || 'Door Delivery',
    estimated_days: (() => {
      const sla = q.sla_description || q.delivery_eta || '';
      const match = sla.match(/\d+/);
      return match ? parseInt(match[0], 10) : 3;
    })(),
    amount: q.fee || q.price || q.amount || q.cost || 0,
    currency: q.currency || 'NGN',
  }));
}

// ─────────────────────────────────────────────
// 2. Create / book a shipment after payment
//    POST /shipping/shipments
// ─────────────────────────────────────────────
export async function createShipment(params: {
  rateId: string;
  orderId: string;
  destination: SendboxAddress;
  items: Array<{
    weight?: string;
    dimensions?: string;
    quantity: number;
    name: string;
    price?: number;
  }>;
}): Promise<SendboxShipment> {
  if (!SENDBOX_TOKEN) throw new Error('Sendbox API token not configured');

  let totalWeight = 0;
  let maxLength = 1;
  let maxWidth = 1;
  let maxHeight = 1;
  let totalItems = 0;
  let totalValue = 0;

  for (const item of params.items) {
    const qty = item.quantity || 1;
    const dims = parseDimensions(item.dimensions);
    totalWeight += parseWeight(item.weight) * qty;
    totalItems += qty;
    totalValue += (item.price || 1000) * qty;
    if (dims.length > maxLength) maxLength = dims.length;
    if (dims.width > maxWidth) maxWidth = dims.width;
    if (dims.height > maxHeight) maxHeight = dims.height;
  }

  if (totalWeight < 0.5) totalWeight = 0.5;

  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 1);
  const pickupDateStr = pickupDate.toISOString().split('T')[0];

  const sender = splitName(SENDER.name);
  const recipient = splitName(params.destination.name);

  const body = {
    quote_id: params.rateId,
    region: 'NG',
    currency: 'NGN',
    channel_code: 'api',
    service_type: 'local',
    package_type: 'general',
    incoming_option: 'pickup',
    pickup_date: pickupDateStr,
    total_value: totalValue,

    weight: totalWeight,
    dimension: {
      length: maxLength,
      width: maxWidth,
      height: maxHeight,
    },

    origin: {
      first_name: sender.first,
      last_name: sender.last,
      name: SENDER.name,
      email: SENDER.email,
      phone: SENDER.phone,
      street: SENDER.address,
      street_line_2: '',
      city: SENDER.city,
      state: SENDER.state,
      country: SENDER.country_code,
      post_code: '',
      lat: null,
      lng: null,
    },

    destination: {
      first_name: recipient.first,
      last_name: recipient.last,
      name: params.destination.name,
      email: params.destination.email,
      phone: params.destination.phone,
      street: params.destination.address,
      street_line_2: '',
      city: params.destination.city,
      state: params.destination.state,
      country: 'NG',
      post_code: '',
      lat: null,
      lng: null,
    },

    items: params.items.map((item) => ({
      name: item.name,
      quantity: item.quantity || 1,
      value: item.price || 1000,
      item_type: 'general',
      hts_code: '',
    })),
  };

  const response = await sendboxFetch<any>('/shipping/shipments', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const raw = response?.data || response;

  return {
    shipment_id: raw.id || raw.shipment_id || raw.tracking_id || '',
    tracking_number:
      raw.tracking_number || raw.tracking_code || raw.waybill_number || raw.id || '',
    courier: raw.courier_name || raw.courier || '',
    status: raw.status || 'booked',
    label_url: raw.label_url || raw.waybill_url || '',
  };
}

// ─────────────────────────────────────────────
// 3. Track a shipment
//    GET /shipping/shipments/:id
// ─────────────────────────────────────────────
export async function trackShipment(shipmentId: string): Promise<{
  status: string;
  events: Array<{ timestamp: string; description: string; location?: string }>;
}> {
  if (!SENDBOX_TOKEN) throw new Error('Sendbox API token not configured');

  const response = await sendboxFetch<any>(`/shipping/shipments/${shipmentId}`);
  const raw = response?.data || response;

  return {
    status: raw.status || 'Pending',
    events: (raw.events || raw.tracking_history || raw.logs || []).map((e: any) => ({
      timestamp: e.timestamp || e.created_at || new Date().toISOString(),
      description: e.description || e.message || e.status || '',
      location: e.location || e.hub || '',
    })),
  };
}
