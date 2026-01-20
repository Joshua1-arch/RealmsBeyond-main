'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPackage, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

type Order = {
  id: string;
  _id?: string;
  status: string;
  payment_status: string;
  created_at: string;
  total_amount: number;
  shipping_address: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Ensure id exists for every order
        const mappedOrders = (ordersData || []).map((order: any) => ({
          ...order,
          id: order.id || order._id || '',
        }));

        setOrders(mappedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isLoading, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
                    <p className="font-body text-rare-text-light">Loading orders...</p>
                  </div>
                </Card>
              ) : orders.length === 0 ? (
                <Card padding="lg">
                  <div className="text-center py-12">
                    <FiPackage className="h-16 w-16 text-rare-text-light/30 mx-auto mb-4" />
                    <p className="font-body text-lg text-rare-text-light mb-4">
                      You haven't placed any orders yet.
                    </p>
                    <Button href="/products" variant="primary">
                      Browse Products
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} padding="lg" hover>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="font-heading text-xl font-normal text-rare-primary">
                              Order #{order.id.slice(0, 8)}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-body font-medium uppercase ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-body font-medium uppercase ${getStatusColor(
                                order.payment_status
                              )}`}
                            >
                              {order.payment_status}
                            </span>
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
                            <div className="flex items-center gap-2 text-rare-text-light">
                              <FiPackage className="h-4 w-4" />
                              <span>{order.shipping_address}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
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

