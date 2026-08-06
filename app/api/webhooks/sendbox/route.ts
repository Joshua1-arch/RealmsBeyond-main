import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';

/**
 * POST /api/webhooks/sendbox
 *
 * Receives shipment status updates from Sendbox.
 * Sendbox sends events like: shipment.created, shipment.picked_up,
 * shipment.in_transit, shipment.delivered, shipment.failed
 *
 * Webhook URL to register in Sendbox dashboard:
 *   https://www.beyondrealmsltd.com/api/webhooks/sendbox
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Sendbox Webhook] Event received:', JSON.stringify(body, null, 2));

    const event = body?.event || body?.type || body?.status;
    const data = body?.data || body;

    // Extract tracking/shipment ID from whichever field Sendbox sends
    const shipmentId =
      data?.id ||
      data?.shipment_id ||
      data?.tracking_id ||
      data?.tracking_number;

    if (!shipmentId) {
      console.warn('[Sendbox Webhook] No shipment ID found in payload');
      return NextResponse.json({ received: true });
    }

    await dbConnect();

    // Find the order by sendbox_shipment_id or tracking_number
    const order = await Order.findOne({
      $or: [
        { sendbox_shipment_id: shipmentId },
        { tracking_number: shipmentId },
      ],
    });

    if (!order) {
      // Not necessarily an error — could be a test event
      console.warn('[Sendbox Webhook] No order found for shipment ID:', shipmentId);
      return NextResponse.json({ received: true });
    }

    // Map Sendbox event to our internal shipment_status
    let newShipmentStatus = order.shipment_status;
    let newOrderStatus = order.status;

    const eventLower = (event || '').toLowerCase();

    if (eventLower.includes('picked') || eventLower.includes('collected')) {
      newShipmentStatus = 'in_transit';
    } else if (eventLower.includes('transit') || eventLower.includes('dispatch')) {
      newShipmentStatus = 'in_transit';
      newOrderStatus = 'shipped';
    } else if (eventLower.includes('delivered')) {
      newShipmentStatus = 'delivered';
      newOrderStatus = 'delivered';
    } else if (eventLower.includes('failed') || eventLower.includes('returned')) {
      newShipmentStatus = 'failed';
    }

    // Only update if something changed
    if (
      newShipmentStatus !== order.shipment_status ||
      newOrderStatus !== order.status
    ) {
      await Order.findByIdAndUpdate(order._id, {
        shipment_status: newShipmentStatus,
        status: newOrderStatus,
      });

      console.log(
        `[Sendbox Webhook] Order ${order._id} updated — shipment: ${newShipmentStatus}, order: ${newOrderStatus}`
      );
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('[Sendbox Webhook] Error:', error);
    // Always return 200 to Sendbox so they don't retry unnecessarily
    return NextResponse.json({ received: true });
  }
}
