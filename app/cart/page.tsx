'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCart } from '@/contexts/CartContext';
import { FiShoppingCart, FiTrash2, FiMinus, FiPlus, FiArrowRight } from 'react-icons/fi';

export default function CartPage() {
    const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();

    const subtotal = getTotalPrice();
    const tax = subtotal * 0.075; // 7.5% tax estimate
    const total = subtotal + tax;

    return (
        <>
            <Header />

            <main className="min-h-screen bg-rare-background py-8 md:py-12">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <div className="mb-6 flex items-center gap-2 text-sm text-rare-text-light">
                        <Link href="/" className="hover:text-rare-primary transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-rare-primary">Shopping Cart</span>
                    </div>

                    {/* Page Title */}
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="font-heading text-3xl md:text-4xl font-normal text-rare-primary">
                            Shopping Cart
                        </h1>
                        {items.length > 0 && (
                            <span className="text-rare-text-light">
                                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
                            </span>
                        )}
                    </div>

                    {/* Empty Cart State */}
                    {items.length === 0 ? (
                        <Card padding="lg">
                            <div className="text-center py-16">
                                <FiShoppingCart className="h-20 w-20 text-rare-text-light/30 mx-auto mb-6" />
                                <h2 className="font-heading text-2xl font-normal text-rare-primary mb-3">
                                    Your cart is empty
                                </h2>
                                <p className="font-body text-rare-text-light mb-8 max-w-md mx-auto">
                                    Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
                                </p>
                                <Button href="/products" variant="primary" size="lg">
                                    Browse Products
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Cart Items - Left Side (2/3) */}
                            <div className="lg:col-span-2 space-y-4">
                                {items.map((item) => (
                                    <Card key={item.id} padding="md">
                                        <div className="flex gap-4 md:gap-6">
                                            {/* Product Image */}
                                            <Link
                                                href={item.slug ? `/products/${item.slug}` : '#'}
                                                className="flex-shrink-0"
                                            >
                                                <img
                                                    src={item.image || '/placeholder-product.jpg'}
                                                    alt={item.name}
                                                    className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg hover:opacity-80 transition-opacity"
                                                />
                                            </Link>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between gap-4 mb-2">
                                                    <Link
                                                        href={item.slug ? `/products/${item.slug}` : '#'}
                                                        className="block"
                                                    >
                                                        <h3 className="font-heading text-lg md:text-xl font-normal text-rare-primary hover:text-rare-secondary transition-colors line-clamp-2">
                                                            {item.name}
                                                        </h3>
                                                    </Link>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="flex-shrink-0 p-2 text-rare-text-light hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        aria-label="Remove item"
                                                    >
                                                        <FiTrash2 className="h-5 w-5" />
                                                    </button>
                                                </div>

                                                <p className="font-body text-lg font-semibold text-rare-primary mb-4">
                                                    ₦{item.price.toLocaleString()}
                                                </p>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 border border-rare-border rounded-lg">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="p-2 hover:bg-rare-primary-light transition-colors rounded-l-lg"
                                                            aria-label="Decrease quantity"
                                                        >
                                                            <FiMinus className="h-4 w-4 text-rare-primary" />
                                                        </button>
                                                        <span className="font-body text-base text-rare-text w-12 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="p-2 hover:bg-rare-primary-light transition-colors rounded-r-lg"
                                                            aria-label="Increase quantity"
                                                        >
                                                            <FiPlus className="h-4 w-4 text-rare-primary" />
                                                        </button>
                                                    </div>
                                                    <span className="font-body text-sm text-rare-text-light">
                                                        Subtotal: <span className="text-rare-primary font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}

                                {/* Clear Cart Button */}
                                <div className="flex justify-between items-center pt-4">
                                    <Link
                                        href="/products"
                                        className="font-body text-sm text-rare-primary hover:text-rare-secondary transition-colors flex items-center gap-2"
                                    >
                                        ← Continue Shopping
                                    </Link>
                                    <button
                                        onClick={clearCart}
                                        className="font-body text-sm text-rare-text-light hover:text-red-600 transition-colors"
                                    >
                                        Clear Cart
                                    </button>
                                </div>
                            </div>

                            {/* Order Summary - Right Side (1/3) */}
                            <div className="lg:col-span-1">
                                <Card padding="lg" className="sticky top-4">
                                    <h2 className="font-heading text-2xl font-normal text-rare-primary mb-6">
                                        Order Summary
                                    </h2>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between text-rare-text">
                                            <span className="font-body">Subtotal ({getTotalItems()} items)</span>
                                            <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-rare-text">
                                            <span className="font-body">Estimated Tax (7.5%)</span>
                                            <span className="font-semibold">₦{tax.toLocaleString()}</span>
                                        </div>
                                        <div className="border-t border-rare-border pt-4">
                                            <div className="flex justify-between">
                                                <span className="font-heading text-lg font-normal text-rare-primary">Total</span>
                                                <span className="font-heading text-2xl font-normal text-rare-primary">
                                                    ₦{total.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        href="/checkout"
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        className="mb-4"
                                    >
                                        Proceed to Checkout
                                        <FiArrowRight className="ml-2" />
                                    </Button>


                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
