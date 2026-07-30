import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import { getAuthUser } from '@/lib/auth';
import { initializeTransaction } from '@/lib/paystack';

/**
 * POST /api/orders/[id]/pay
 * Re-initializes a Paystack payment for a pending order.
 * Used for payment recovery when customer abandoned checkout.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only the order owner or admin can trigger payment
    if (order.user_id?.toString() !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow re-payment for pending orders
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'This order has already been paid' }, { status: 400 });
    }

    if (['cancelled', 'refunded'].includes(order.payment_status)) {
      return NextResponse.json({ error: 'Cannot process payment for this order' }, { status: 400 });
    }

    // Re-initialize Paystack transaction
    const paystackResponse = await initializeTransaction(
      order.customer_email,
      order.total_amount,
      { order_id: order._id.toString() }
    );

    // Update the stored access code (in case it changed)
    await Order.findByIdAndUpdate(id, {
      paystack_access_code: paystackResponse.data.access_code,
    });

    return NextResponse.json({
      payment_url: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
    });
  } catch (error: unknown) {
    console.error('[Order Pay] Error:', error);
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}
