'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  MdLocalShipping, MdCheckCircle, MdPending, MdCreditCard,
  MdLocationOn, MdEvent, MdPhone, MdMail, MdCopyAll, MdErrorOutline,
} from 'react-icons/md';
import { FiPackage, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

type OrderItem = {
  _id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
};

type TrackingEvent = {
  timestamp: string;
  description: string;
  location?: string;
};

type Order = {
  _id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  total_amount: number;
  shipping_cost: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  paystack_reference?: string;
  paid_at?: string;
  courier_name?: string;
  tracking_number?: string;
  shipment_status?: string;
  shipment_booked_at?: string;
  created_at: string;
  items: OrderItem[];
};

type TrackingData = {
  tracking_available: boolean;
  tracking_number?: string;
  courier?: string;
  shipment_status?: string;
  events?: TrackingEvent[];
  message?: string;
};

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: FiPackage },
  { key: 'processing', label: 'Processing', icon: MdPending },
  { key: 'shipped', label: 'Shipped', icon: MdLocalShipping },
  { key: 'delivered', label: 'Delivered', icon: MdCheckCircle },
];

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { user, isLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [payingLoading, setPayingLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push(`/signin?returnTo=/orders/${orderId}`);
  }, [user, isLoading, router, orderId]);

  useEffect(() => {
    if (!orderId || isLoading) return;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        const mapped = { ...data, _id: data._id || data.id, items: data.items || [] };
        setOrder(mapped);
      } catch (err) {
        setError('Could not load order details');
      } finally {
        setOrderLoading(false);
      }
    })();
  }, [orderId, isLoading]);

  const fetchTracking = async () => {
    setTrackingLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/track`);
      const data = await res.json();
      setTracking(data);
    } catch {
      setTracking({ tracking_available: false, message: 'Could not fetch tracking' });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    setPayingLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.payment_url) window.location.href = data.payment_url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setPayingLoading(false);
    }
  };

  const copyTracking = () => {
    if (order?.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (orderLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <AiOutlineLoading3Quarters className="h-10 w-10 animate-spin text-rare-primary" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <MdErrorOutline className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <p className="text-rare-text-light mb-4">{error || 'Order not found'}</p>
            <Button href="/orders" variant="outline">Back to Orders</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status);
  const isPendingPayment = order.payment_status === 'pending';
  const subtotal = order.total_amount - (order.shipping_cost || 0);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-rare-accent/5 to-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <Link href="/orders" className="text-rare-text-light hover:text-rare-primary transition-colors">
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-3xl font-normal text-rare-primary">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-rare-text-light text-sm mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Pending Payment Alert */}
          {isPendingPayment && (
            <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-3">
                <MdCreditCard className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800">Payment Pending</p>
                  <p className="text-sm text-amber-700">Your order is saved. Complete payment to process your shipment.</p>
                </div>
              </div>
              <Button variant="primary" size="sm" disabled={payingLoading} onClick={handleCompletePayment}>
                {payingLoading ? <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" /> : 'Complete Payment'}
              </Button>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Order Status Timeline */}
              <Card>
                <h3 className="font-heading text-xl mb-6 text-rare-primary">Order Status</h3>
                <div className="flex items-center justify-between mb-2">
                  {STATUS_STEPS.map((step, i) => {
                    const isCompleted = STATUS_ORDER.indexOf(step.key) <= currentStatusIndex;
                    const isCurrent = STATUS_ORDER.indexOf(step.key) === currentStatusIndex;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex-1 flex flex-col items-center relative">
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`absolute top-5 left-1/2 w-full h-1 transition-all ${
                            STATUS_ORDER.indexOf(step.key) < currentStatusIndex ? 'bg-rare-primary' : 'bg-gray-200'
                          }`} />
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all border-2 ${
                          isCompleted
                            ? 'bg-rare-primary border-rare-primary text-white'
                            : isCurrent
                            ? 'border-rare-primary bg-white text-rare-primary'
                            : 'border-gray-200 bg-white text-gray-300'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className={`text-xs mt-2 font-medium text-center ${isCompleted ? 'text-rare-primary' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Shipment Tracking */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-xl text-rare-primary flex items-center gap-2">
                    <MdLocalShipping className="w-5 h-5" /> Shipment Tracking
                  </h3>
                  {order.tracking_number && (
                    <Button
                      variant="outline" size="sm"
                      onClick={fetchTracking}
                      disabled={trackingLoading}
                    >
                      {trackingLoading
                        ? <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                        : <><FiRefreshCw className="h-3 w-3 mr-1" /> Refresh</>
                      }
                    </Button>
                  )}
                </div>

                {order.tracking_number ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-rare-text-light uppercase font-semibold mb-1">Tracking Number</p>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-rare-primary text-sm">{order.tracking_number}</code>
                          <button onClick={copyTracking} className="text-gray-400 hover:text-rare-primary transition-colors">
                            <MdCopyAll className="w-4 h-4" />
                          </button>
                          {copied && <span className="text-xs text-green-600">Copied!</span>}
                        </div>
                      </div>
                      {order.courier_name && (
                        <div>
                          <p className="text-xs text-rare-text-light uppercase font-semibold mb-1">Courier</p>
                          <p className="font-medium text-rare-text">{order.courier_name}</p>
                        </div>
                      )}
                    </div>

                    {/* Tracking Events */}
                    {tracking?.events && tracking.events.length > 0 && (
                      <div className="mt-4 space-y-3 pt-4 border-t border-rare-border">
                        {tracking.events.map((evt, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-rare-primary mt-2 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-rare-text">{evt.description}</p>
                              <p className="text-xs text-rare-text-light flex items-center gap-1">
                                <MdEvent className="w-3 h-3" />
                                {new Date(evt.timestamp).toLocaleString()}
                                {evt.location && ` · ${evt.location}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!tracking && (
                      <p className="text-sm text-rare-text-light">
                        Click "Refresh" to get the latest tracking update from {order.courier_name || 'the courier'}.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-rare-text-light">
                    <FiPackage className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      {isPendingPayment
                        ? 'Shipment will be booked once payment is confirmed.'
                        : 'Tracking information will appear here once your order ships.'}
                    </p>
                  </div>
                )}
              </Card>

              {/* Order Items */}
              <Card>
                <h3 className="font-heading text-xl mb-4 text-rare-primary flex items-center gap-2">
                  <FiPackage className="w-5 h-5" /> Items Ordered
                </h3>
                <div className="space-y-3">
                  {order.items.map(item => (
                    <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-rare-text">{item.product_name}</p>
                        <p className="text-sm text-rare-text-light">{item.quantity} × ₦{item.product_price.toLocaleString()}</p>
                      </div>
                      <p className="font-bold text-rare-primary">₦{item.subtotal.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-rare-border space-y-2">
                  <div className="flex justify-between text-sm text-rare-text-light">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  {order.shipping_cost > 0 && (
                    <div className="flex justify-between text-sm text-rare-text-light">
                      <span>Shipping {order.courier_name ? `(${order.courier_name})` : ''}</span>
                      <span>₦{order.shipping_cost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-rare-primary text-lg pt-2 border-t border-rare-border">
                    <span>Total</span>
                    <span>₦{order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Info */}
              <Card>
                <h3 className="font-heading text-lg mb-4 text-rare-primary flex items-center gap-2">
                  <MdCreditCard className="w-5 h-5" /> Payment
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-rare-text-light uppercase font-semibold mb-1">Status</p>
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-sm font-bold capitalize ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                  {order.payment_method && (
                    <div>
                      <p className="text-xs text-rare-text-light uppercase font-semibold mb-1">Method</p>
                      <p className="text-sm font-medium text-rare-text capitalize">{order.payment_method}</p>
                    </div>
                  )}
                  {order.paid_at && (
                    <div>
                      <p className="text-xs text-rare-text-light uppercase font-semibold mb-1">Paid At</p>
                      <p className="text-sm text-rare-text">{new Date(order.paid_at).toLocaleString()}</p>
                    </div>
                  )}
                  {order.paystack_reference && (
                    <div>
                      <p className="text-xs text-rare-text-light uppercase font-semibold mb-1">Reference</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600 block truncate">
                        {order.paystack_reference}
                      </code>
                    </div>
                  )}
                </div>
              </Card>

              {/* Delivery Address */}
              <Card>
                <h3 className="font-heading text-lg mb-4 text-rare-primary flex items-center gap-2">
                  <MdLocationOn className="w-5 h-5" /> Delivery Address
                </h3>
                <p className="text-sm text-rare-text leading-relaxed">{order.shipping_address}</p>
              </Card>

              {/* Need Help */}
              <Card className="bg-rare-accent/10 border-rare-accent/20">
                <h3 className="font-heading text-lg mb-3 text-rare-primary">Need Help?</h3>
                <p className="text-sm text-rare-text-light mb-4">Contact our support team for assistance with your order.</p>
                <div className="space-y-2">
                  <a href="mailto:support@beyondrealmsltd.com" className="flex items-center gap-2 text-sm text-rare-primary hover:underline">
                    <MdMail className="w-4 h-4" /> support@beyondrealmsltd.com
                  </a>
                </div>
              </Card>

              <div className="space-y-3">
                <Button variant="outline" fullWidth onClick={() => window.print()}>Print Receipt</Button>
                <Button variant="outline" fullWidth href="/products">Continue Shopping</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
