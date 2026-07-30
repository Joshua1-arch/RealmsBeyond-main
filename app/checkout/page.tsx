'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  MdShoppingCart, MdCreditCard, MdLocationOn, MdPerson, MdMail,
  MdPhone, MdLock, MdErrorOutline, MdLocalShipping, MdCheckCircle,
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FiPackage, FiClock } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { NIGERIAN_STATES } from '@/lib/shipping';

interface ShippingRate {
  id: string;
  courier: string;
  courier_logo?: string;
  service_type: string;
  estimated_days: number;
  amount: number;
  currency: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, clearCart, getTotalPrice } = useCart();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState(1); // 1=shipping, 2=courier, 3=payment
  const [loading, setLoading] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  useEffect(() => {
    if (cartItems.length === 0 && step === 1) {
      router.push('/products');
    }
  }, [cartItems, router, step]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signin?returnTo=${encodeURIComponent('/checkout')}`);
    }
  }, [user, isLoading, router]);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
  });
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  // Load saved address on mount or when user loads
  useEffect(() => {
    try {
      const saved = localStorage.getItem('realms_saved_shipping_address');
      if (saved) {
        const parsed = JSON.parse(saved);
        setShippingInfo((prev) => ({ ...prev, ...parsed }));
        setHasSavedAddress(true);
        return;
      }
    } catch {}

    if (user) {
      setShippingInfo((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const subtotal = getTotalPrice();
  const shippingCost = selectedRate?.amount ?? 0;
  const total = subtotal + shippingCost;

  // ─────────────────────────────────────────────
  // Step 1 → Step 2: fetch Shipbubble rates
  // ─────────────────────────────────────────────
  const handleShippingSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setRatesLoading(true);
    setError(null);

    // Save address for future checkouts
    try {
      localStorage.setItem('realms_saved_shipping_address', JSON.stringify(shippingInfo));
      setHasSavedAddress(true);
    } catch {}

    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: {
            name: shippingInfo.fullName,
            email: shippingInfo.email,
            phone: shippingInfo.phone,
            address: shippingInfo.address,
            city: shippingInfo.city,
            state: shippingInfo.state,
            country: shippingInfo.country,
          },
          items: cartItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch shipping rates');
      }

      setShippingRates(data.rates || []);
      setSelectedRate(null);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load shipping rates. Please check your address.');
    } finally {
      setRatesLoading(false);
    }
  }, [shippingInfo, cartItems]);

  // ─────────────────────────────────────────────
  // Step 3: place order + redirect to Paystack
  // ─────────────────────────────────────────────
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRate) {
      setError('Please select a shipping option');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          shipping: shippingInfo,
          selected_rate: selectedRate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      if (data.payment_url) {
        clearCart();
        window.location.href = data.payment_url;
      } else {
        setError('Order created but payment could not be initialized. Find your order in "My Orders" to complete payment.');
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setLoading(false);
    }
  };

  const stepLabels = [
    { num: 1, label: 'Shipping' },
    { num: 2, label: 'Courier' },
    { num: 3, label: 'Payment' },
  ];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-rare-accent/5 to-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm text-rare-text-light">
            <Link href="/" className="hover:text-rare-primary">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-rare-primary">Products</Link>
            <span>/</span>
            <span className="text-rare-primary">Checkout</span>
          </div>

          <h1 className="font-heading text-4xl font-normal text-rare-primary mb-8">Checkout</h1>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <MdErrorOutline className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-4">
              {stepLabels.map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div className={`flex items-center gap-2 ${step >= s.num ? 'text-rare-primary' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= s.num ? 'bg-rare-primary text-white' : 'bg-gray-200'}`}>
                      {step > s.num ? <MdCheckCircle className="w-5 h-5" /> : s.num}
                    </div>
                    <span className="font-medium hidden md:block">{s.label}</span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`h-1 w-16 mx-2 transition-all ${step > s.num ? 'bg-rare-primary' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">

              {/* ─── Step 1: Shipping Info ─── */}
              {step === 1 && (
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <MdLocationOn className="w-6 h-6 text-rare-primary" />
                      <h2 className="font-heading text-2xl font-normal text-rare-primary">Shipping Information</h2>
                    </div>
                    {hasSavedAddress && (
                      <button
                        type="button"
                        onClick={() => setEditingAddress(!editingAddress)}
                        className="text-xs text-rare-primary font-semibold underline hover:text-rare-primary-dark"
                      >
                        {editingAddress ? 'Use Saved Address' : 'Use Different Address'}
                      </button>
                    )}
                  </div>

                  {hasSavedAddress && !editingAddress ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-rare-accent/10 border border-rare-accent/30 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-rare-primary text-base mb-1">{shippingInfo.fullName}</p>
                            <p className="text-sm text-rare-text mb-1">{shippingInfo.address}, {shippingInfo.city}, {shippingInfo.state}</p>
                            <p className="text-xs text-rare-text-light">{shippingInfo.phone} · {shippingInfo.email}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            Saved Address
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="primary"
                          fullWidth
                          size="lg"
                          onClick={() => handleShippingSubmit({ preventDefault: () => {} } as any)}
                        >
                          {ratesLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" /> Fetching Live Rates...
                            </span>
                          ) : (
                            'Continue to Courier Selection →'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleShippingSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rare-text mb-2">
                          <MdPerson className="inline w-4 h-4 mr-1" /> Full Name *
                        </label>
                        <Input type="text" placeholder="John Doe" value={shippingInfo.fullName}
                          onChange={e => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                          required fullWidth />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rare-text mb-2">
                          <MdMail className="inline w-4 h-4 mr-1" /> Email *
                        </label>
                        <Input type="email" placeholder="john@example.com" value={shippingInfo.email}
                          onChange={e => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                          required fullWidth />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rare-text mb-2">
                        <MdPhone className="inline w-4 h-4 mr-1" /> Phone Number *
                      </label>
                      <Input type="tel" placeholder="+234 803 000 0000" value={shippingInfo.phone}
                        onChange={e => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                        required fullWidth />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rare-text mb-2">Street Address *</label>
                      <Input type="text" placeholder="123 Main Street, Apt 4B" value={shippingInfo.address}
                        onChange={e => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                        required fullWidth />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rare-text mb-2">City *</label>
                        <Input type="text" placeholder="Lagos" value={shippingInfo.city}
                          onChange={e => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                          required fullWidth />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rare-text mb-2">State *</label>
                        {shippingInfo.country === 'Nigeria' ? (
                          <select
                            className="w-full px-4 py-3 border border-rare-border rounded-lg font-body text-rare-text focus:outline-none focus:ring-2 focus:ring-rare-primary"
                            value={shippingInfo.state}
                            onChange={e => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                            required
                          >
                            <option value="">Select State</option>
                            {NIGERIAN_STATES.map(s => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <Input type="text" placeholder="State/Province" value={shippingInfo.state}
                            onChange={e => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                            required fullWidth />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rare-text mb-2">ZIP Code *</label>
                        <Input type="text" placeholder="100001" value={shippingInfo.zipCode}
                          onChange={e => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                          required fullWidth />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rare-text mb-2">Country *</label>
                      <select
                        className="w-full px-4 py-3 border border-rare-border rounded-lg font-body text-rare-text focus:outline-none focus:ring-2 focus:ring-rare-primary"
                        value={shippingInfo.country}
                        onChange={e => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                        required
                      >
                        <option>Nigeria</option>
                        <option>United States</option>
                        <option>United Kingdom</option>
                        <option>Canada</option>
                        <option>Australia</option>
                      </select>
                    </div>

                    <div className="pt-4">
                      <Button type="submit" variant="primary" size="lg" fullWidth disabled={ratesLoading}>
                        {ratesLoading ? (
                          <><AiOutlineLoading3Quarters className="h-4 w-4 animate-spin mr-2" /> Fetching Rates...</>
                        ) : 'Continue to Courier Selection'}
                      </Button>
                    </div>
                  </form>
                  )}
                </Card>
              )}

              {/* ─── Step 2: Courier Selection ─── */}
              {step === 2 && (
                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <MdLocalShipping className="w-6 h-6 text-rare-primary" />
                    <h2 className="font-heading text-2xl font-normal text-rare-primary">Select Courier</h2>
                  </div>

                  {shippingRates.length === 0 ? (
                    <div className="text-center py-12 text-rare-text-light">
                      <FiPackage className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No shipping options available for this address.</p>
                      <Button variant="outline" className="mt-4" onClick={() => setStep(1)}>Change Address</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shippingRates.map(rate => (
                        <button
                          key={rate.id}
                          type="button"
                          onClick={() => setSelectedRate(rate)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedRate?.id === rate.id
                              ? 'border-rare-primary bg-rare-primary/5 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                                selectedRate?.id === rate.id ? 'border-rare-primary bg-rare-primary' : 'border-gray-300'
                              }`}>
                                {selectedRate?.id === rate.id && (
                                  <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-rare-text">{rate.courier}</p>
                                <p className="text-sm text-rare-text-light capitalize">{rate.service_type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-rare-primary text-lg">
                                ₦{rate.amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-rare-text-light flex items-center gap-1 justify-end">
                                <FiClock className="w-3 h-3" />
                                {rate.estimated_days} day{rate.estimated_days !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4 pt-6">
                    <Button type="button" variant="outline" size="lg" fullWidth onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      type="button" variant="primary" size="lg" fullWidth
                      disabled={!selectedRate}
                      onClick={() => { setError(null); setStep(3); }}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </Card>
              )}

              {/* ─── Step 3: Payment ─── */}
              {step === 3 && (
                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <MdCreditCard className="w-6 h-6 text-rare-primary" />
                    <h2 className="font-heading text-2xl font-normal text-rare-primary">Payment Information</h2>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    {selectedRate && (
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                        <div className="flex items-center gap-2">
                          <MdLocalShipping className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-800">{selectedRate.courier}</p>
                            <p className="text-xs text-green-600">{selectedRate.estimated_days} day delivery</p>
                          </div>
                        </div>
                        <p className="font-bold text-green-800">₦{selectedRate.amount.toLocaleString()}</p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="font-semibold text-rare-primary mb-2 flex items-center gap-2">
                        <MdCreditCard className="w-5 h-5" /> Paystack Secure Payment
                      </h3>
                      <p className="text-sm text-rare-text-light mb-4">
                        You will be redirected to Paystack to complete your payment securely. We support all major cards, bank transfers, and USSD.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-rare-text-light">
                        <MdLock className="w-4 h-4" />
                        Your transaction is secured with 256-bit SSL encryption.
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button type="button" variant="outline" size="lg" fullWidth onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button
                        type="submit" variant="primary" size="lg" fullWidth
                        disabled={loading || cartItems.length === 0}
                      >
                        {loading ? (
                          <><AiOutlineLoading3Quarters className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                        ) : (
                          `Pay ₦${total.toLocaleString()} Securely`
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <div className="flex items-center gap-3 mb-6">
                  <MdShoppingCart className="w-6 h-6 text-rare-primary" />
                  <h2 className="font-heading text-2xl font-normal text-rare-primary">Order Summary</h2>
                </div>

                <div className="space-y-4 mb-6 pb-6 border-b border-rare-border">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h3 className="font-medium text-rare-text">{item.name}</h3>
                        <p className="text-sm text-rare-text-light">Qty: {item.quantity}</p>
                        <p className="font-semibold text-rare-primary">₦{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-rare-text">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rare-text">
                    <span>Shipping</span>
                    <span className={shippingCost === 0 ? 'text-gray-400 italic' : ''}>
                      {shippingCost === 0 ? 'Select courier' : `₦${shippingCost.toLocaleString()}`}
                    </span>
                  </div>
                  {selectedRate && (
                    <div className="text-xs text-rare-text-light flex items-center gap-1">
                      <MdLocalShipping className="w-3 h-3" />
                      via {selectedRate.courier}
                    </div>
                  )}
                  <div className="border-t border-rare-border pt-3 flex justify-between font-bold text-lg text-rare-primary">
                    <span>Total</span>
                    <span>₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
