import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import { getAuthUser } from '@/lib/auth';
import { verifyTransaction } from '@/lib/paystack';
import { createShipmentFromRate, UnifiedShippingRate } from '@/lib/shipping';

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

    // Attempt automatic shipment booking if not booked yet
    if (order.shipping_rate_id && !order.tracking_number) {
      try {
        const orderItems = await OrderItem.find({ order_id: order._id });
        const rateId = order.shipping_rate_id;
        const provider = rateId.startsWith('shipbubble:') ? 'shipbubble' : 'sendbox';

        const rateObj: UnifiedShippingRate = {
          id: rateId,
          provider: provider as 'sendbox' | 'shipbubble',
          courier: order.courier_name || 'Courier',
          service_type: 'Standard',
          estimated_days: 3,
          amount: order.shipping_cost,
          currency: 'NGN',
        };

        if (!order.shipping_city) {
          console.warn('[Verify Reference] Order missing explicit shipping_city, parsing address string:', order._id);
        }

        const bookingResult = await createShipmentFromRate(
          rateObj,
          order._id.toString(),
          {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone || '08000000000',
            address: order.shipping_address,
            city: order.shipping_city || order.shipping_address.split(',')[1]?.trim() || 'Lagos',
            state: order.shipping_state || order.shipping_address.split(',')[2]?.trim()?.split(' ')[0] || 'Lagos',
            country: 'Nigeria',
          },
          orderItems.map((item) => ({
            name: item.product_name,
            quantity: item.quantity,
            weight: parseFloat(item.weight || '0.5') || 0.5,
            dimensions: item.dimensions,
            price: item.product_price,
          }))
        );

        if (bookingResult.success && bookingResult.shipmentId) {
          order.tracking_number = bookingResult.trackingCode || bookingResult.shipmentId;
          order.shipment_status = 'booked';
          order.shipment_booked_at = new Date();
          order.status = 'shipped';
        } else {
          order.shipment_status = 'failed';
          order.notes = `Shipment booking notice: ${bookingResult.message || 'Booking failed'}`;
        }
      } catch (shipErr: any) {
        console.warn('[Verify Reference] Shipment booking fallback notice:', shipErr.message);
        order.shipment_status = 'failed';
        order.notes = `Shipment booking exception: ${shipErr.message}`;
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
