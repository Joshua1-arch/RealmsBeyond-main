import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Order, { IOrder } from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import Product from '@/lib/models/Product';
import { getAuthUser } from '@/lib/auth';
import { validateShippingInfo } from '@/lib/validation';
import { initializeTransaction } from '@/lib/paystack';
import { getMergedShippingRates } from '@/lib/shipping';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const filter: Record<string, any> = {};
    // If not admin, restrict to own orders
    if (user.role !== 'admin') {
      filter.user_id = user.userId;
    }

    if (status) filter.status = status;

    const orders = await Order.find(filter).sort({ created_at: -1 }).lean();

    // Optimized: Fetch all items for these orders in one query
    const orderIds = orders.map(o => o._id);
    const allItems = await OrderItem.find({ order_id: { $in: orderIds } }).lean();

    const ordersWithItems = orders.map(order => {
      const items = allItems.filter(item => item.order_id.toString() === order._id.toString());
      return { ...order, items };
    });

    return NextResponse.json(ordersWithItems);
  } catch (error: unknown) {
    console.error('[Orders API] GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, shipping, selected_rate } = body;

    // Validate shipping info
    if (!shipping) {
      return NextResponse.json({ error: 'Shipping information is required' }, { status: 400 });
    }

    const shippingValidation = validateShippingInfo(shipping);
    if (!shippingValidation.valid) {
      return NextResponse.json({ error: shippingValidation.errors.join('; ') }, { status: 400 });
    }

    // Validate selected shipping rate structure
    if (!selected_rate || !selected_rate.id || typeof selected_rate.amount !== 'number') {
      return NextResponse.json({ error: 'A shipping rate must be selected' }, { status: 400 });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 });
    }

    if (items.length > 100) {
      return NextResponse.json({ error: 'Too many items in order' }, { status: 400 });
    }

    // Fetch product prices from database to prevent price manipulation
    const productIds = items.map((item: { id: string }) => item.id);
    const products = await Product.find({ _id: { $in: productIds }, in_stock: true }).lean();

    if (products.length !== items.length) {
      return NextResponse.json({ error: 'Some products are unavailable or out of stock' }, { status: 400 });
    }

    // Create a map for quick price lookup
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // Calculate server-side total and validate quantities
    let calculatedTotal = 0;
    const validatedItems: {
      order_id: mongoose.Types.ObjectId | null;
      product_id: mongoose.Types.ObjectId;
      product_name: string;
      product_price: number;
      quantity: number;
      subtotal: number;
      weight?: string;
      dimensions?: string;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product) {
        return NextResponse.json({ error: `Product ${item.id} not found` }, { status: 400 });
      }

      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity < 1 || quantity > 100) {
        return NextResponse.json({ error: 'Invalid quantity for one or more items' }, { status: 400 });
      }

      const itemSubtotal = product.price * quantity;
      calculatedTotal += itemSubtotal;

      validatedItems.push({
        order_id: null,
        product_id: product._id,
        product_name: product.name,
        product_price: product.price,
        quantity: quantity,
        subtotal: itemSubtotal,
        weight: product.weight,
        dimensions: product.dimensions,
      });
    }

    // Re-verify selected shipping rate server-side to prevent price tampering
    let shippingCost = 0;
    let matchedCourierName = selected_rate.courier || '';

    try {
      const liveRates = await getMergedShippingRates(
        {
          name: shipping.fullName.trim(),
          email: shipping.email.toLowerCase().trim(),
          phone: shipping.phone.trim(),
          address: shipping.address.trim(),
          city: shipping.city.trim(),
          state: shipping.state.trim(),
          country: shipping.country || 'Nigeria',
        },
        validatedItems.map((item) => ({
          name: item.product_name,
          quantity: item.quantity,
          weight: parseFloat(item.weight || '0.5') || 0.5,
          dimensions: item.dimensions,
          price: item.product_price,
        }))
      );

      const matchedRate = liveRates.find((r) => r.id === selected_rate.id);
      if (!matchedRate) {
        return NextResponse.json(
          { error: 'Selected shipping rate is no longer available. Please refresh rates.' },
          { status: 400 }
        );
      }

      shippingCost = Math.round(matchedRate.amount);
      matchedCourierName = matchedRate.courier;
    } catch (rateErr) {
      console.error('[Orders API] Live rate verification failed — rejecting order (fail-closed):', rateErr);
      return NextResponse.json(
        { error: 'Unable to verify shipping rate right now. Please try again.' },
        { status: 503 }
      );
    }

    calculatedTotal += shippingCost;

    // Sanity check on total
    if (calculatedTotal <= 0 || calculatedTotal > 100000000) {
      return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
    }

    // Start database transaction strictly for atomic document creation
    const session = await mongoose.startSession();
    session.startTransaction();

    let order: IOrder;
    try {
      [order] = await Order.create([{
        user_id: user.userId,
        customer_name: shipping.fullName.trim(),
        customer_email: shipping.email.toLowerCase().trim(),
        customer_phone: shipping.phone.trim(),
        shipping_address: `${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zipCode}, ${shipping.country}`,
        shipping_city: shipping.city.trim(),
        shipping_state: shipping.state.trim(),
        total_amount: calculatedTotal,
        shipping_cost: shippingCost,
        courier_name: matchedCourierName || selected_rate.courier || '',
        shipping_rate_id: selected_rate.id,
        status: 'pending',
        payment_status: 'pending',
        shipment_status: 'pending',
      }], { session });

      validatedItems.forEach(item => { item.order_id = order._id; });
      await OrderItem.insertMany(validatedItems, { session });

      await session.commitTransaction();
    } catch (dbErr) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw dbErr;
    } finally {
      session.endSession();
    }

    // Initialize Paystack payment (outside transaction — non-reversible)
    try {
      const paystackResponse = await initializeTransaction(
        shipping.email.toLowerCase().trim(),
        calculatedTotal,
        { order_id: order._id.toString() }
      );

      // Store the access code so we can re-initialize payment if needed
      await Order.findByIdAndUpdate(order._id, {
        paystack_access_code: paystackResponse.data.access_code,
        paystack_reference: paystackResponse.data.reference,
      });

      return NextResponse.json({
        order,
        payment_url: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference,
      }, { status: 201 });
    } catch (paystackError: unknown) {
      console.error('Paystack Initialization Error:', paystackError);
      return NextResponse.json({
        order,
        error: 'Order created but failed to initialize payment. Please complete payment from your orders page.',
      }, { status: 201 });
    }
  } catch (error: unknown) {
    console.error('[Orders API] POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
