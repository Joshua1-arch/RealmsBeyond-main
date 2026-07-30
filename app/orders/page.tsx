'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPackage, FiCalendar, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { MdLocalShipping, MdCreditCard } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useAuth } from '@/contexts/AuthContext';

type Order = {
  id: string;
  _id?: string;
  status: string;
  payment_status: string;
  created_at: string;
  total_amount: number;
  shipping_address: string;
  tracking_number?: string;
  courier_name?: string;
  shipment_status?: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/signin?returnTo=/orders');
      return;
    }
    (async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const ordersData = await response.json();
        const mapped = (ordersData || []).map((o: any) => ({
          ...o,
          id: o.id || o._id || '',
        }));
        setOrders(mapped);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isLoading, router]);

  const handleCompletePayment = async (orderId: string) => {
    setPayingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Payment initialization failed');
    } finally {
      setPayingOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-rare-background">
        <Section background="gradient-soft" padding="lg">
          <div className="container">
            <div className="max-w-6xl mx-auto">
              <h1 className="font-heading text-4xl md:text-5xl font-normal text-rare-primary mb-8">
                My Orders
              </h1>

              {loading ? (
                <Card padding="lg">
                  <div className="text-center py-12">
                    <AiOutlineLoading3Quarters className="h-8 w-8 animate-spin mx-auto text-rare-primary mb-3" />
                    <p className="font-body text-rare-text-light">Loading orders...</p>
                  </div>
                </Card>
              ) : orders.length === 0 ? (
                <Card padding="lg">
                  <div className="text-center py-12">
                    <FiPackage className="h-16 w-16 text-rare-text-light/30 mx-auto mb-4" />
                    <p className="font-body text-lg text-rare-text-light mb-4">You haven't placed any orders yet.</p>
                    <Button href="/products" variant="primary">Browse Products</Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const isPendingPayment = order.payment_status === 'pending';
                    const hasTracking = !!order.tracking_number;

                    return (
                      <Card key={order.id} padding="lg" hover>
                        {/* Pending Payment Banner */}
                        {isPendingPayment && (
                          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                            <FiAlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-700">
                              Payment is pending for this order. Complete your payment to proceed.
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <h3 className="font-heading text-xl font-normal text-rare-primary">
                                Order #{order.id.slice(-8).toUpperCase()}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(order.payment_status)}`}>
                                {order.payment_status}
                              </span>
                              {order.shipment_status && order.shipment_status !== 'pending' && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium uppercase bg-blue-100 text-blue-800">
                                  {order.shipment_status.replace('_', ' ')}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-rare-text-light">
                                <FiCalendar className="h-4 w-4" />
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-rare-text-light">
                                <FiDollarSign className="h-4 w-4" />
                                <span className="font-semibold text-rare-primary">
                                  ₦{order.total_amount.toLocaleString()}
                                </span>
                              </div>
                              {hasTracking ? (
                                <div className="flex items-center gap-2 text-rare-text-light">
                                  <MdLocalShipping className="h-4 w-4" />
                                  <span className="font-mono text-xs">{order.tracking_number}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-rare-text-light">
                                  <FiPackage className="h-4 w-4" />
                                  <span className="truncate max-w-[200px]">{order.shipping_address}</span>
                                </div>
                              )}
                            </div>

                            {order.courier_name && (
                              <p className="mt-2 text-xs text-rare-text-light">
                                Courier: <span className="font-medium text-rare-text">{order.courier_name}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex-shrink-0 flex flex-col gap-2">
                            {isPendingPayment && (
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={payingOrderId === order.id}
                                onClick={() => handleCompletePayment(order.id)}
                              >
                                {payingOrderId === order.id ? (
                                  <><AiOutlineLoading3Quarters className="h-3 w-3 animate-spin mr-1" /> Loading...</>
                                ) : (
                                  <><MdCreditCard className="h-4 w-4 mr-1" /> Complete Payment</>
                                )}
                              </Button>
                            )}
                            <Link href={`/orders/${order.id}`}>
                              <Button variant="outline" size="sm" fullWidth>View Details</Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
