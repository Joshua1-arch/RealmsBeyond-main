import React from "react";
import OrdersContent from "@/app/admin/orders/OrdersContent";
import Order from "@/lib/models/Order";
import OrderItem from "@/lib/models/OrderItem";

import dbConnect from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  try {
    await dbConnect();
    // Fetch orders and their items
    const orders = await Order.find().sort({ created_at: -1 });

    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await OrderItem.find({ order_id: order._id });
      // Convert MongoDB objects to plain objects and map _id to id for frontend compatibility
      return {
        ...order.toObject(),
        id: order._id.toString(),
        order_items: items.map(item => ({
          ...item.toObject(),
          id: item._id.toString()
        }))
      };
    }));

    return (
      <OrdersContent initialOrders={JSON.parse(JSON.stringify(ordersWithItems))} />
    );
  } catch (error) {
    console.error('[OrdersPage] Server fetch error:', error);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Failed to load orders</h1>
        <p className="text-gray-600">Please check your database connection.</p>
      </div>
    );
  }
}
