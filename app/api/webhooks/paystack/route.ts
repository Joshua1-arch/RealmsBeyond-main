import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import { verifyTransaction } from '@/lib/paystack';
import { createShipmentFromRate, UnifiedShippingRate } from '@/lib/shipping';
import { sendEmail } from '@/lib/email';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    const hashBuffer = Buffer.from(hash, 'hex');
    const sigBuffer = Buffer.from(signature, 'hex');

    if (hashBuffer.length !== sigBuffer.length || !crypto.timingSafeEqual(hashBuffer, sigBuffer)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
      const { reference, metadata, channel } = event.data;
      const orderId = metadata?.order_id;

      if (!orderId) {
        return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
      }

      if (!reference) {
        return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
      }

      await dbConnect();

      const existingOrder = await Order.findById(orderId);
      if (!existingOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Early idempotency check to avoid redundant Paystack API verification calls
      if (existingOrder.payment_status === 'paid') {
        return NextResponse.json({ received: true, message: 'Already processed' }, { status: 200 });
      }

      // Prevent processing if order is in a terminal state
      if (['cancelled', 'refunded'].includes(existingOrder.status)) {
        return NextResponse.json({ error: 'Order is in terminal state' }, { status: 400 });
      }

      // VERIFY WITH PAYSTACK API - Don't trust webhook data alone
      let verification;
      try {
        verification = await verifyTransaction(reference);
      } catch {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }

      if (!verification.status || verification.data.status !== 'success') {
        return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
      }

      // Verify amount matches (amount in kobo)
      const expectedAmountKobo = existingOrder.total_amount * 100;
      const paidAmountKobo = verification.data.amount;

      if (paidAmountKobo < expectedAmountKobo) {
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
      }

      // Verify order_id in metadata matches
      if (verification.data.metadata?.order_id !== orderId) {
        return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 });
      }

      // Update order as paid — use findOneAndUpdate with conditions for atomicity
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: orderId,
          payment_status: { $ne: 'paid' }, // Only update if not already paid
        },
        {
          payment_status: 'paid',
          status: 'processing',
          paystack_reference: reference,
          paid_at: new Date(),
          payment_method: channel || verification.data.channel || 'card',
        },
        { new: true }
      );

      if (!updatedOrder) {
        // Already updated by concurrent request - idempotent
        return NextResponse.json({ received: true, message: 'Already processed' });
      }

      // ──────────────────────────────────────────────────────
      // Book shipment AFTER payment confirmed (Sendbox or Shipbubble)
      // ──────────────────────────────────────────────────────
      if (updatedOrder.shipping_rate_id) {
        try {
          const orderItems = await OrderItem.find({ order_id: orderId }).lean();

          const rateId = updatedOrder.shipping_rate_id;
          const provider = rateId.startsWith('shipbubble:') ? 'shipbubble' : 'sendbox';

          const rateObj: UnifiedShippingRate = {
            id: rateId,
            provider: provider as 'sendbox' | 'shipbubble',
            courier: updatedOrder.courier_name || 'Courier',
            service_type: 'Standard',
            estimated_days: 3,
            amount: updatedOrder.shipping_cost,
            currency: 'NGN',
          };

          if (!updatedOrder.shipping_city) {
            console.warn('[Webhook] Order missing explicit shipping_city, parsing address string:', orderId);
          }

          const bookingResult = await createShipmentFromRate(
            rateObj,
            orderId,
            {
              name: updatedOrder.customer_name,
              email: updatedOrder.customer_email,
              phone: updatedOrder.customer_phone || '',
              address: updatedOrder.shipping_address,
              city: updatedOrder.shipping_city || updatedOrder.shipping_address.split(',')[1]?.trim() || 'Lagos',
              state: updatedOrder.shipping_state || updatedOrder.shipping_address.split(',')[2]?.trim()?.split(' ')[0] || 'Lagos',
              country: 'Nigeria',
            },
            orderItems.map((i: any) => ({
              name: i.product_name,
              weight: parseFloat(i.weight || '0.5') || 0.5,
              dimensions: i.dimensions,
              quantity: i.quantity,
              price: i.product_price,
            }))
          );

          if (bookingResult.success && bookingResult.shipmentId) {
            await Order.findByIdAndUpdate(orderId, {
              sendbox_shipment_id: bookingResult.shipmentId,
              tracking_number: bookingResult.trackingCode || bookingResult.shipmentId,
              shipment_status: 'booked',
              shipment_booked_at: new Date(),
              status: 'processing',
            });

            // Send tracking confirmation email
            await sendOrderConfirmationEmail(
              updatedOrder.customer_email,
              updatedOrder.customer_name,
              orderId,
              updatedOrder.total_amount,
              bookingResult.trackingCode || bookingResult.shipmentId,
              updatedOrder.courier_name || provider
            );
          } else {
            console.error('[Webhook] Shipment booking returned failure for order', orderId, bookingResult.message);
            await Order.findByIdAndUpdate(orderId, {
              shipment_status: 'failed',
              notes: `Shipment booking failed: ${bookingResult.message || 'Unknown error'}`,
            });
          }
        } catch (shipErr: any) {
          console.error('[Webhook] Shipment booking exception for order', orderId, shipErr);
          await Order.findByIdAndUpdate(orderId, {
            shipment_status: 'failed',
            notes: `Shipment booking exception: ${shipErr.message || String(shipErr)}`,
          });
        }
      } else {
        // No rate ID — send basic confirmation without tracking
        await sendOrderConfirmationEmail(
          updatedOrder.customer_email,
          updatedOrder.customer_name,
          orderId,
          updatedOrder.total_amount
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// Email helper
// ─────────────────────────────────────────────
async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderId: string,
  total: number,
  trackingNumber?: string,
  courierName?: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const orderUrl = `${appUrl}/orders/${orderId}`;

  const trackingSection = trackingNumber
    ? `
      <div style="margin:24px 0;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
        <p style="margin:0 0 8px;font-size:13px;color:#166534;font-weight:600;text-transform:uppercase;">Shipment Booked</p>
        <p style="margin:0;font-size:15px;"><strong>Courier:</strong> ${courierName || 'Courier'}</p>
        <p style="margin:4px 0 0;font-size:15px;"><strong>Tracking Number:</strong> <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;">${trackingNumber}</code></p>
      </div>
    `
    : '';

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#111;">
      <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;">Beyond Realms</h1>
        <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">Order Confirmed 🎉</p>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <h2 style="color:#1a1a2e;margin:0 0 16px;">Hi ${name},</h2>
        <p style="color:#374151;line-height:1.6;">Your payment has been confirmed and your order is now being processed. Thank you for shopping with Beyond Realms!</p>
        ${trackingSection}
        <div style="margin:24px 0;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;">Order Summary</p>
          <p style="margin:0;font-size:15px;"><strong>Order ID:</strong> #${orderId.slice(-8).toUpperCase()}</p>
          <p style="margin:4px 0 0;font-size:15px;"><strong>Total Paid:</strong> ₦${total.toLocaleString()}</p>
        </div>
        <a href="${orderUrl}" style="display:block;text-align:center;background:#1a1a2e;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;margin-top:24px;">
          Track Your Order
        </a>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px;text-align:center;">
          Questions? Email us at <a href="mailto:support@beyondrealmsltd.com" style="color:#1a1a2e;">support@beyondrealmsltd.com</a>
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail(email, `Order Confirmed — Beyond Realms #${orderId.slice(-8).toUpperCase()}`, html);
  } catch (err) {
    console.error('[Webhook] Failed to send confirmation email:', err);
  }
}
