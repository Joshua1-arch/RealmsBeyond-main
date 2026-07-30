import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import { getAuthUser } from '@/lib/auth';
import { verifyTransaction } from '@/lib/paystack';
import { createShipment } from '@/lib/shipbubble';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const order = await Order.findOne({ paystack_reference: reference });
    if (!order) {
      return NextResponse.json({ error: 'Order not found for this reference' }, { status: 404 });
    }

    // Check authorization: must be order owner or admin
    if (user && user.role !== 'admin' && order.user_id?.toString() !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ verified: true, message: 'Already paid', order });
    }

    // Verify status with Paystack
    const verification = await verifyTransaction(reference);

    if (!verification.status || verification.data.status !== 'success') {
      return NextResponse.json({
        verified: false,
        paystack_status: verification.data?.status || 'pending',
        message: 'Payment not completed yet',
      });
    }

    // Mark order as paid
    order.payment_status = 'paid';
    order.status = 'processing';
    order.paid_at = new Date();
    order.payment_method = verification.data.channel || 'card';

    // Attempt automatic Shipbubble booking if not booked yet
    if (order.shipping_rate_id && !order.tracking_number) {
      try {
        const orderItems = await OrderItem.find({ order_id: order._id });
        const itemsForShipbubble = orderItems.map((item) => ({
          name: item.product_name,
          quantity: item.quantity,
          weight: item.weight || '0.5',
          dimensions: item.dimensions || '20x15x10',
        }));

        const shipment = await createShipment({
          rateId: order.shipping_rate_id,
          orderId: order._id.toString(),
          destination: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone || '08000000000',
            address: order.shipping_address,
            city: order.shipping_city || 'Lagos',
            state: order.shipping_state || 'Lagos',
            country: 'Nigeria',
          },
          items: itemsForShipbubble,
        });

        if (shipment) {
          const s = shipment as any;
          order.courier_name = s.courier_name || s.courier || order.courier_name;
          order.tracking_number = s.tracking_number || s.shipment_id;
          order.shipment_status = s.status || 'booked';
          order.shipment_booked_at = new Date();
          order.status = 'shipped';
        }
      } catch (shipErr: any) {
        console.warn('[Verify Reference] Shipbubble booking fallback notice:', shipErr.message);
      }
    }

    await order.save();

    return NextResponse.json({
      verified: true,
      message: 'Payment verified and order status updated',
      order,
    });
  } catch (error: any) {
    console.error('[Verify Reference API] Error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
