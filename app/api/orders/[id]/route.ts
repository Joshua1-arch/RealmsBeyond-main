import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import { getAuthUser } from '@/lib/auth';

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [], // Terminal state
  cancelled: [], // Terminal state
};

// Valid payment status transitions
const VALID_PAYMENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'failed'],
  paid: ['refunded'],
  failed: ['pending'], // Allow retry
  refunded: [], // Terminal state
};

export async function GET(
  request: NextRequest,
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

    const items = await OrderItem.find({ order_id: id });

    return NextResponse.json({ ...order.toObject(), items });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Fetch existing order
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Whitelist allowed fields - prevent manipulation of sensitive fields
    const allowedFields = ['status', 'notes', 'tracking_number', 'courier_name', 'shipment_status'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate status transition
    if (updateData.status) {
      const currentStatus = existingOrder.status;
      const newStatus = updateData.status;
      const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

      if (!validTransitions.includes(newStatus)) {
        return NextResponse.json({ 
          error: `Invalid status transition from '${currentStatus}' to '${newStatus}'` 
        }, { status: 400 });
      }
    }

    // payment_status can ONLY be updated through webhook, not admin PATCH
    // This prevents admins from marking orders as paid without actual payment
    if (body.payment_status !== undefined) {
      return NextResponse.json({ 
        error: 'Payment status cannot be modified directly. It is updated automatically upon payment.' 
      }, { status: 400 });
    }

    // Prevent modification of terminal-state orders
    if (['delivered', 'cancelled'].includes(existingOrder.status) && updateData.status) {
      return NextResponse.json({ 
        error: 'Cannot modify status of completed or cancelled orders' 
      }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prevent deletion of paid orders
    if (existingOrder.payment_status === 'paid') {
      return NextResponse.json({ 
        error: 'Cannot delete paid orders. Cancel the order first if needed.' 
      }, { status: 400 });
    }

    await Order.findByIdAndDelete(id);
    await OrderItem.deleteMany({ order_id: id });

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
