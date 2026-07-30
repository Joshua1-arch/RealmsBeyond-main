import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getShippingRates } from '@/lib/shipbubble';

/**
 * POST /api/shipping/rates
 * Body: { destination: ShipbubbleAddress, items: CartItem[] }
 * Returns: array of courier rate options
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { destination, items } = body;

    if (!destination || !destination.name || !destination.address || !destination.state || !destination.city) {
      return NextResponse.json({ error: 'Incomplete destination address' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    try {
      const rates = await getShippingRates(destination, items);
      if (rates && rates.length > 0) {
        return NextResponse.json({ rates });
      }
    } catch (sbError: any) {
      console.warn('[Shipping Rates API] Shipbubble live fetch failed, using fallback standard rate:', sbError.message);
    }

    // Fallback standard rates if Shipbubble API returns empty or sandbox error
    const fallbackRates = [
      {
        id: 'standard_delivery',
        courier: 'Standard Courier (Door Delivery)',
        courier_logo: '',
        service_type: 'Door Delivery',
        estimated_days: 3,
        amount: 2500,
        currency: 'NGN',
      },
      {
        id: 'express_delivery',
        courier: 'Express Courier (Priority)',
        courier_logo: '',
        service_type: 'Express Delivery',
        estimated_days: 1,
        amount: 4500,
        currency: 'NGN',
      },
    ];

    return NextResponse.json({ rates: fallbackRates });
  } catch (error: unknown) {
    console.error('[Shipping Rates API] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch shipping rates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
