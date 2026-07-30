import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import { getAuthUser } from '@/lib/auth';
import { verifyTransaction } from '@/lib/paystack';

/**
 * POST /api/orders/[id]/verify-payment
 * Manually triggers a Paystack payment verification for an order.
 * Used by admins when webhook was delayed or lost.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.paystack_reference) {
      return NextResponse.json({ error: 'No Paystack reference found for this order' }, { status: 400 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ message: 'Order is already marked as paid', order });
    }

    // Call Paystack API directly to check the payment status
    const verification = await verifyTransaction(order.paystack_reference);

    if (!verification.status || verification.data.status !== 'success') {
      return NextResponse.json({
        verified: false,
        paystack_status: verification.data?.status || 'unknown',
        message: 'Payment has not been completed on Paystack',
      });
    }

    // Verify the amount matches
    const expectedAmountKobo = order.total_amount * 100;
    const paidAmountKobo = verification.data.amount;

    if (paidAmountKobo < expectedAmountKobo) {
      return NextResponse.json({
        verified: false,
        message: `Amount mismatch: expected ₦${order.total_amount}, Paystack shows ₦${paidAmountKobo / 100}`,
      }, { status: 400 });
    }

    // Update order to paid status
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: id, payment_status: { $ne: 'paid' } },
      {
        payment_status: 'paid',
        status: 'processing',
        paid_at: new Date(),
        payment_method: verification.data.channel || 'card',
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ message: 'Order already updated (concurrent request)', order });
    }

    return NextResponse.json({
      verified: true,
      message: 'Payment verified and order updated successfully',
      order: updatedOrder,
    });
  } catch (error: unknown) {
    console.error('[Verify Payment] Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
