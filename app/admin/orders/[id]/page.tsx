import React from 'react';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import OrderItem from '@/lib/models/OrderItem';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiPrinter, FiMail, FiMapPin, FiPhone, FiUser, FiCreditCard, FiCalendar } from 'react-icons/fi';
import { MdCheckCircle, MdCancel, MdPending, MdLocalShipping } from 'react-icons/md';

const statusColors: Record<string, string> = {
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    shipped: 'bg-purple-50 text-purple-700 border-purple-200',
};

const statusIcons: Record<string, any> = {
    processing: MdLocalShipping,
    completed: MdCheckCircle,
    delivered: MdCheckCircle,
    pending: MdPending,
    cancelled: MdCancel,
    shipped: MdLocalShipping,
};

export const dynamic = 'force-dynamic';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;
    await dbConnect();

    let order = null;
    let items = [];

    try {
        const orderDoc = await Order.findById(id).lean();
        if (!orderDoc) return notFound();

        order = JSON.parse(JSON.stringify(orderDoc));
        const itemsDoc = await OrderItem.find({ order_id: id }).populate('product_id', 'images').lean();
        items = JSON.parse(JSON.stringify(itemsDoc));
    } catch (error) {
        console.error('Error fetching order:', error);
        return notFound();
    }

    const StatusIcon = statusIcons[order.status] || MdPending;

    return (
        <div className="bg-gray-50 min-h-screen p-6 lg:p-10">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-rare-primary transition-colors text-sm font-medium mb-2">
                            <FiArrowLeft /> Back to Orders
                        </Link>
                        <h1 className="text-3xl font-heading font-bold text-gray-900 flex items-center gap-3">
                            Order #{order._id.slice(-6).toUpperCase()}
                            <span className={`px-3 py-1 rounded-full text-sm font-body border flex items-center gap-1.5 ${statusColors[order.status] || 'bg-gray-100'}`}>
                                <StatusIcon className="w-4 h-4" />
                                <span className="capitalize">{order.status}</span>
                            </span>
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Placed on {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-all text-sm font-medium">
                            <FiPrinter /> Print Invoice
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-rare-primary text-white rounded-lg hover:bg-rare-secondary shadow-lg shadow-rare-primary/20 transition-all text-sm font-medium">
                            <FiMail /> Email Customer
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Order Items & Payment */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Order Items */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="font-heading font-bold text-gray-900 text-lg">Order Items</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                                        <tr>
                                            <th className="p-4 pl-6">Product</th>
                                            <th className="p-4">Price</th>
                                            <th className="p-4 text-center">Qty</th>
                                            <th className="p-4 text-right pr-6">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((item: any) => (
                                            <tr key={item._id} className="text-sm">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                                            {item.product_id?.images?.[0] ? (
                                                                <img src={item.product_id.images[0]} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-200" />
                                                            )}
                                                        </div>
                                                        <div className="font-medium text-gray-900 max-w-[200px] truncate" title={item.product_name}>
                                                            {item.product_name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-600">₦{item.product_price.toLocaleString()}</td>
                                                <td className="p-4 text-center font-medium bg-gray-50/50">{item.quantity}</td>
                                                <td className="p-4 text-right pr-6 font-bold text-gray-900">₦{item.subtotal.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50/50">
                                        <tr>
                                            <td colSpan={3} className="p-4 text-right font-medium text-gray-500">Subtotal</td>
                                            <td className="p-4 text-right pr-6 font-bold text-gray-900">₦{order.total_amount.toLocaleString()}</td>
                                        </tr>
                                        {/* Tax/Shipping would go here if applicable */}
                                        <tr className="border-t border-gray-200 text-base">
                                            <td colSpan={3} className="p-4 text-right font-bold text-gray-900">Total Amount</td>
                                            <td className="p-4 text-right pr-6 font-bold text-rare-primary text-lg">₦{order.total_amount.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h2 className="font-heading font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                                <FiCreditCard className="text-gray-400" /> Payment Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Status</span>
                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-sm font-bold capitalize ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {order.payment_status}
                                    </span>
                                </div>
                                {/* Method */}
                                {order.payment_method && (
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Method</span>
                                        <span className="text-sm font-medium text-gray-900 capitalize">{order.payment_method}</span>
                                    </div>
                                )}
                                {/* Reference */}
                                {order.paystack_reference && (
                                    <div className="col-span-1 md:col-span-2">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Reference ID</span>
                                        <code className="text-sm bg-gray-100 px-2 py-1 rounded border border-gray-200 font-mono text-gray-600 block w-full truncate">
                                            {order.paystack_reference}
                                        </code>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Customer & Shipping */}
                    <div className="space-y-8">
                        {/* Customer */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h2 className="font-heading font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                                <FiUser className="text-gray-400" /> Customer
                            </h2>
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div className="w-12 h-12 rounded-full bg-rare-primary/10 flex items-center justify-center text-rare-primary font-bold text-lg">
                                    {order.customer_name[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{order.customer_name}</div>
                                    <div className="text-sm text-gray-500">Customer</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <FiMail className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Email</div>
                                        <a href={`mailto:${order.customer_email}`} className="text-sm text-rare-primary hover:underline break-all">
                                            {order.customer_email}
                                        </a>
                                    </div>
                                </div>
                                {order.customer_phone && (
                                    <div className="flex items-start gap-3">
                                        <FiPhone className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Phone</div>
                                            <div className="text-sm text-gray-900">{order.customer_phone}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h2 className="font-heading font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                                <FiMapPin className="text-gray-400" /> Delivery Address
                            </h2>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed">
                                {order.shipping_address}
                            </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                            <div className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-6">
                                <h2 className="font-heading font-bold text-amber-900 text-lg mb-2">Order Notes</h2>
                                <p className="text-sm text-amber-800 italic">
                                    "{order.notes}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
