import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import { getAuthUser } from '@/lib/auth';
import { trackShipment } from '@/lib/sendbox';

/**
 * GET /api/orders/[id]/track
 * Returns live tracking data from Sendbox.
 */
export async function GET(
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

    if (order.user_id?.toString() !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!order.sendbox_shipment_id) {
      return NextResponse.json({
        tracking_available: false,
        message: 'Shipment has not been booked yet',
        shipment_status: order.shipment_status || 'pending',
      });
    }

    const trackingData = await trackShipment(order.sendbox_shipment_id);

    // Update the local shipment status if it changed
    if (trackingData.status && trackingData.status !== order.shipment_status) {
      let newStatus = order.shipment_status;
      const statusLower = trackingData.status.toLowerCase();
      if (statusLower.includes('transit') || statusLower.includes('picked')) newStatus = 'in_transit';
      else if (statusLower.includes('delivered')) newStatus = 'delivered';

      if (newStatus !== order.shipment_status) {
        await Order.findByIdAndUpdate(id, { shipment_status: newStatus });
      }
    }

    return NextResponse.json({
      tracking_available: true,
      tracking_number: order.tracking_number,
      courier: order.courier_name,
      shipment_status: trackingData.status,
      events: trackingData.events,
    });
  } catch (error: unknown) {
    console.error('[Track Order] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking info' }, { status: 500 });
  }
}
