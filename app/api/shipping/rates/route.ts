import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getShippingRates } from '@/lib/sendbox';

/**
 * POST /api/shipping/rates
 * Body: { destination: SendboxAddress, items: CartItem[] }
 * Returns: array of courier rate options from Sendbox
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

    const rates = await getShippingRates(destination, items);

    if (!rates || rates.length === 0) {
      return NextResponse.json({ error: 'No shipping rates available for this address. Please check your address and try again.' }, { status: 422 });
    }

    return NextResponse.json({ rates });
  } catch (error: unknown) {
    console.error('[Shipping Rates API] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch shipping rates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
