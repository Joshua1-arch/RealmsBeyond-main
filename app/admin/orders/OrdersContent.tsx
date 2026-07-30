"use client";

import React, { useState } from "react";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdErrorOutline, MdCheckCircle, MdRemoveRedEye, MdLocalShipping, MdCreditCard, MdCopyAll, MdVerified } from 'react-icons/md';
import { FiCalendar, FiUser, FiMail, FiMapPin, FiPackage, FiSearch, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { useDebounce } from "@/hooks/useDebounce";

interface OrderItem {
  id: string; product_name: string; product_price: number; quantity: number; subtotal: number;
}
interface Order {
  id: string; customer_name: string; customer_email: string; customer_phone?: string;
  shipping_address: string; total_amount: number; shipping_cost?: number;
  status: string; payment_status: string; payment_method?: string;
  paystack_reference?: string; paid_at?: string;
  courier_name?: string; tracking_number?: string; shipment_status?: string;
  created_at: string; order_items: OrderItem[]; notes?: string;
}

type FilterTab = 'all' | 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export default function OrdersContent({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };
  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(null), 5000); };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      showSuccess(`Order status updated to ${newStatus}`);
    } catch (err: any) { showError(err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyPayment = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/verify-payment`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      if (data.verified) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'paid', status: 'processing' } : o));
        if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, payment_status: 'paid' } : null);
        showSuccess('Payment verified — order updated to paid');
      } else {
        showError(`Not paid on Paystack: ${data.message}`);
      }
    } catch (err: any) { showError(err.message); }
    finally { setActionLoading(null); }
  };

  const handleSendPaymentLink = async (order: Order) => {
    setActionLoading(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/pay`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showSuccess(`Payment link generated. URL: ${data.payment_url}`);
    } catch (err: any) { showError(err.message); }
    finally { setActionLoading(null); }
  };

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending_payment', label: 'Pending Payment' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filtered = orders.filter(o => {
    const matchTab =
      activeTab === 'all' ? true :
      activeTab === 'pending_payment' ? o.payment_status === 'pending' :
      o.status === activeTab;
    const matchSearch = debouncedSearch === '' ||
      o.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (o.tracking_number || '').toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchTab && matchSearch;
  });

  const statusColor = (s: string) => ({
    delivered: 'bg-green-50 text-green-600 border-green-200',
    shipped: 'bg-blue-50 text-blue-600 border-blue-200',
    processing: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
    pending: 'bg-gray-50 text-gray-600 border-gray-200',
  }[s] || 'bg-gray-50 text-gray-600 border-gray-200');

  const payColor = (s: string) => ({
    paid: 'bg-green-50 text-green-600 border-green-200',
    pending: 'bg-amber-50 text-amber-600 border-amber-200',
    failed: 'bg-red-50 text-red-600 border-red-200',
    refunded: 'bg-purple-50 text-purple-600 border-purple-200',
  }[s] || 'bg-gray-50 text-gray-600 border-gray-200');

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-6 lg:p-10">
        <div className="mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="font-heading text-3xl font-bold text-gray-900 flex items-center gap-3">
              Orders
              <span className="text-sm font-normal text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">{orders.length} total</span>
            </h1>
            {loading && <AiOutlineLoading3Quarters className="animate-spin text-rare-primary h-6 w-6" />}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {TABS.map(t => {
              const count = t.key === 'all' ? orders.length :
                t.key === 'pending_payment' ? orders.filter(o => o.payment_status === 'pending').length :
                orders.filter(o => o.status === t.key).length;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${activeTab === t.key ? 'bg-rare-primary text-white border-rare-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  {t.label} <span className="ml-1 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="relative w-full md:w-80">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search orders, email, tracking..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-rare-primary/20 focus:border-rare-primary focus:outline-none transition-all" />
            </div>
          </div>

          {/* Notifications */}
          {error && <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><MdErrorOutline className="h-5 w-5 flex-shrink-0" /><p>{error}</p></div>}
          {success && <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"><MdCheckCircle className="h-5 w-5 flex-shrink-0" /><p>{success}</p></div>}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-600 font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Order</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Courier</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-gray-500">No orders found.</td></tr>
                  ) : filtered.map(order => (
                    <tr key={order.id} className={`group hover:bg-gray-50 transition-colors ${order.payment_status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                      <td className="p-4">
                        <span className="font-mono text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded">#{order.id.slice(-8).toUpperCase()}</span>
                        {order.tracking_number && (
                          <p className="text-xs text-blue-600 mt-1 font-mono">{order.tracking_number}</p>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="font-bold text-gray-900">{order.customer_name}</div>
                        <div className="text-gray-500 text-xs">{order.customer_email}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-500">{fmt(order.created_at)}</td>
                      <td className="p-4 text-sm font-bold text-rare-primary">
                        ₦{order.total_amount.toLocaleString()}
                        {order.shipping_cost ? <div className="text-xs text-gray-400 font-normal">+₦{order.shipping_cost.toLocaleString()} ship</div> : null}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {order.courier_name || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-4">
                        <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)}
                          className={`text-[10px] uppercase font-bold px-2 py-1 rounded border cursor-pointer outline-none focus:ring-2 focus:ring-rare-accent/20 ${statusColor(order.status)}`}>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border inline-block ${payColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                        {order.payment_status === 'pending' && (
                          <div className="flex gap-1 mt-1">
                            <button onClick={() => handleVerifyPayment(order.id)} disabled={actionLoading === order.id}
                              title="Verify with Paystack" className="p-1 rounded bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-all">
                              {actionLoading === order.id ? <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin" /> : <MdVerified className="w-3 h-3" />}
                            </button>
                            <button onClick={() => handleSendPaymentLink(order)} disabled={actionLoading === order.id}
                              title="Generate Payment Link" className="p-1 rounded bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-all">
                              <MdCreditCard className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setSelectedOrder(order)} className="p-2 text-rare-primary hover:bg-gray-100 rounded-lg transition-all" title="View Details">
                          <MdRemoveRedEye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col text-gray-900">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-heading font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-500 font-mono">#{selectedOrder.id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-all">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b pb-2"><FiUser className="text-rare-primary" /> Customer</h3>
                  <p className="flex flex-col"><span className="text-xs text-gray-400">Name</span><span className="font-medium">{selectedOrder.customer_name}</span></p>
                  <p className="flex flex-col"><span className="text-xs text-gray-400">Email</span><a href={`mailto:${selectedOrder.customer_email}`} className="text-rare-primary hover:underline text-sm">{selectedOrder.customer_email}</a></p>
                  {selectedOrder.customer_phone && <p className="flex flex-col"><span className="text-xs text-gray-400">Phone</span><span className="font-medium">{selectedOrder.customer_phone}</span></p>}
                </div>

                {/* Shipping */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b pb-2"><FiMapPin className="text-red-500" /> Delivery Address</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedOrder.shipping_address}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b pb-2"><MdCreditCard className="text-indigo-500" /> Payment Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><span className="text-xs text-gray-400 block mb-1">Status</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${payColor(selectedOrder.payment_status)}`}>{selectedOrder.payment_status}</span>
                  </div>
                  {selectedOrder.payment_method && <div><span className="text-xs text-gray-400 block mb-1">Method</span><span className="text-sm font-medium capitalize">{selectedOrder.payment_method}</span></div>}
                  {selectedOrder.paid_at && <div><span className="text-xs text-gray-400 block mb-1">Paid At</span><span className="text-sm">{fmt(selectedOrder.paid_at)}</span></div>}
                  <div><span className="text-xs text-gray-400 block mb-1">Amount</span><span className="font-bold text-rare-primary">₦{selectedOrder.total_amount.toLocaleString()}</span></div>
                </div>
                {selectedOrder.paystack_reference && (
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Paystack Reference</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1.5 rounded border font-mono text-gray-600 flex-1">{selectedOrder.paystack_reference}</code>
                      <button onClick={() => copyRef(selectedOrder.paystack_reference!)} className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 transition-all">
                        {copiedRef === selectedOrder.paystack_reference ? <span className="text-xs text-green-600">✓</span> : <MdCopyAll className="w-4 h-4 text-gray-500" />}
                      </button>
                    </div>
                  </div>
                )}
                {/* Admin Actions for Pending Payment */}
                {selectedOrder.payment_status === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleVerifyPayment(selectedOrder.id)} disabled={actionLoading === selectedOrder.id}>
                      {actionLoading === selectedOrder.id ? <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin mr-1" /> : <MdVerified className="w-4 h-4 mr-1" />}
                      Verify with Paystack
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSendPaymentLink(selectedOrder)} disabled={actionLoading === selectedOrder.id}>
                      <MdCreditCard className="w-4 h-4 mr-1" /> Generate Payment Link
                    </Button>
                  </div>
                )}
              </div>

              {/* Shipment Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b pb-2"><MdLocalShipping className="text-blue-500" /> Shipment</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedOrder.courier_name && <div><span className="text-xs text-gray-400 block mb-1">Courier</span><span className="text-sm font-medium">{selectedOrder.courier_name}</span></div>}
                  {selectedOrder.shipping_cost !== undefined && <div><span className="text-xs text-gray-400 block mb-1">Shipping Cost</span><span className="font-bold text-rare-primary">₦{selectedOrder.shipping_cost.toLocaleString()}</span></div>}
                  {selectedOrder.shipment_status && <div><span className="text-xs text-gray-400 block mb-1">Shipment Status</span>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 capitalize">{selectedOrder.shipment_status.replace('_', ' ')}</span>
                  </div>}
                </div>
                {selectedOrder.tracking_number && (
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Tracking Number</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-blue-50 px-3 py-1.5 rounded border border-blue-200 font-mono text-blue-700 flex-1">{selectedOrder.tracking_number}</code>
                      <button onClick={() => copyRef(selectedOrder.tracking_number!)} className="p-1.5 rounded border border-gray-200 hover:bg-gray-100">
                        {copiedRef === selectedOrder.tracking_number ? <span className="text-xs text-green-600">✓</span> : <MdCopyAll className="w-4 h-4 text-gray-500" />}
                      </button>
                    </div>
                  </div>
                )}
                {!selectedOrder.tracking_number && selectedOrder.payment_status === 'paid' && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                    <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                    Shipment not yet booked. The system will retry automatically, or manually set tracking number via the edit form.
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b pb-2"><FiPackage className="text-blue-500" /> Order Items</h3>
                {selectedOrder.order_items?.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} × ₦{item.product_price.toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-mono font-bold text-gray-900">₦{item.subtotal.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                {selectedOrder.shipping_cost !== undefined && selectedOrder.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Shipping ({selectedOrder.courier_name || 'courier'})</span>
                    <span>₦{selectedOrder.shipping_cost.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-bold text-gray-500">Total</span>
                  <span className="font-heading text-2xl font-bold text-rare-primary">₦{selectedOrder.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Status Control */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Update Order Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                    <button key={s} onClick={() => handleStatusChange(selectedOrder.id, s)}
                      disabled={selectedOrder.status === s || loading}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selectedOrder.status === s ? 'bg-rare-primary text-white border-rare-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                  <p className="text-xs font-bold text-yellow-600 uppercase mb-1">Order Notes</p>
                  <p className="text-sm text-yellow-800 italic">"{selectedOrder.notes}"</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <Button onClick={() => setSelectedOrder(null)} variant="outline" className="border-gray-300 text-gray-600">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
