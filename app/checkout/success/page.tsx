'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MdCheckCircle, MdLocalShipping, MdMail } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      return;
    }

    async function confirmPayment() {
      try {
        const res = await fetch('/api/orders/verify-reference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();
        if (data.order?._id) {
          setOrderId(data.order._id);
        }
        setVerified(data.verified ?? true);
      } catch (err) {
        console.error('Auto verify failed:', err);
      } finally {
        setLoading(false);
      }
    }

    confirmPayment();
  }, [reference]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        {loading ? (
          <div className="py-20">
            <AiOutlineLoading3Quarters className="w-12 h-12 animate-spin text-rare-primary mx-auto mb-4" />
            <p className="text-rare-text-light">Confirming your payment...</p>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
              <MdCheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-normal text-rare-primary mb-4">Order Confirmed!</h1>
            <p className="font-body text-lg text-rare-text-light mb-2">
              Thank you for your purchase. Your payment has been received.
            </p>
            <p className="text-sm text-rare-text-light mb-10">
              A confirmation email with tracking details has been sent to your inbox.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <Card className="text-center">
                <MdMail className="w-10 h-10 text-rare-primary mx-auto mb-3" />
                <h3 className="font-heading text-base mb-1">Check Your Email</h3>
                <p className="text-xs text-rare-text-light">Confirmation + tracking sent</p>
              </Card>
              <Card className="text-center">
                <MdLocalShipping className="w-10 h-10 text-rare-primary mx-auto mb-3" />
                <h3 className="font-heading text-base mb-1">Shipment Booked</h3>
                <p className="text-xs text-rare-text-light">Courier notified automatically</p>
              </Card>
              <Card className="text-center">
                <MdCheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <h3 className="font-heading text-base mb-1">Track Anytime</h3>
                <p className="text-xs text-rare-text-light">Via "My Orders" in your account</p>
              </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" href={orderId ? `/orders/${orderId}` : '/orders'}>
                View My Order
              </Button>
              <Button variant="outline" size="lg" href="/products">
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center py-20">
          <AiOutlineLoading3Quarters className="w-12 h-12 animate-spin text-rare-primary" />
        </div>
      }>
        <CheckoutSuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}
