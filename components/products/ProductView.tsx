'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MdShoppingCart, MdFavoriteBorder, MdShare, MdStar, MdFavorite } from 'react-icons/md';
import { useCart } from '@/contexts/CartContext';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    compare_at_price?: number;
    images: string[];
    category?: string;
    in_stock: boolean;
    rating?: number;
    reviews?: number;
    sku?: string;
    slug?: string;
    weight?: string;
    dimensions?: string;
    features?: string[];
}

export default function ProductView({ product }: { product: Product }) {
    const router = useRouter();
    const { addItem } = useCart();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);

    if (!product) return null;

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
                        <span className="text-rare-primary">{product.name}</span>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Product Images */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <Card padding="none" className="overflow-hidden">
                                <div className="aspect-square bg-gray-100">
                                    <img
                                        src={product.images?.[selectedImage] || '/placeholder-product.jpg'}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </Card>

                            {/* Thumbnail Images */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-4">
                                    {product.images.map((img: string, index: number) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                                                ? 'border-rare-primary'
                                                : 'border-transparent hover:border-rare-border'
                                                }`}
                                        >
                                            <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            {/* Category */}
                            <div>
                                <span className="text-xs font-body text-rare-text-light uppercase tracking-wide">
                                    {product.category}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="font-heading text-4xl font-normal text-rare-primary">
                                {product.name}
                            </h1>

                            {/* Rating */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <MdStar
                                            key={i}
                                            className={`w-5 h-5 ${i < Math.floor(product.rating || 0)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-rare-text-light">
                                    {product.rating} ({product.reviews} reviews)
                                </span>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-4">
                                <span className="font-heading text-4xl font-normal text-rare-primary">
                                    ₦{product.price.toLocaleString()}
                                </span>
                                {product.compare_at_price && (
                                    <span className="font-body text-xl text-rare-text-light line-through">
                                        ₦{product.compare_at_price.toLocaleString()}
                                    </span>
                                )}
                                {product.compare_at_price && (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                        Save ₦{(product.compare_at_price - product.price).toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* Stock Status */}
                            <div>
                                {product.in_stock ? (
                                    <span className="text-green-600 font-medium">✓ In Stock</span>
                                ) : (
                                    <span className="text-red-600 font-medium">Out of Stock</span>
                                )}
                                <span className="text-sm text-rare-text-light ml-4">SKU: {product.sku}</span>
                            </div>

                            {/* Description */}
                            <div className="border-t border-b border-rare-border py-6">
                                <p className="font-body text-rare-text leading-relaxed">
                                    {product.description}
                                </p>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4">
                                <span className="font-medium text-rare-text">Quantity:</span>
                                <div className="flex items-center border border-rare-border rounded-lg">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-4 py-2 hover:bg-rare-primary-light transition"
                                    >
                                        −
                                    </button>
                                    <span className="px-6 py-2 border-x border-rare-border">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-4 py-2 hover:bg-rare-primary-light transition"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4 relative z-20">
                                <div className="flex gap-4">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        onClick={() => {
                                            addItem({
                                                id: product.id,
                                                name: product.name,
                                                price: product.price,
                                                image: product.images?.[0],
                                                slug: product.slug,
                                                weight: product.weight,
                                                dimensions: product.dimensions,
                                            });
                                        }}
                                        className="relative z-30"
                                    >
                                        <MdShoppingCart className="w-5 h-5 mr-2" />
                                        Add to Cart
                                    </Button>
                                    <button
                                        onClick={() => setIsFavorite(!isFavorite)}
                                        className="px-6 border border-rare-border rounded-lg hover:bg-rare-primary-light transition relative z-30"
                                    >
                                        {isFavorite ? (
                                            <MdFavorite className="w-6 h-6 text-red-500" />
                                        ) : (
                                            <MdFavoriteBorder className="w-6 h-6 text-rare-primary" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.share({
                                                title: product.name,
                                                text: product.description,
                                                url: window.location.href,
                                            }).catch(() => {
                                                // Fallback: copy to clipboard
                                                navigator.clipboard.writeText(window.location.href);
                                            });
                                        }}
                                        className="px-6 border border-rare-border rounded-lg hover:bg-rare-primary-light transition relative z-30"
                                    >
                                        <MdShare className="w-6 h-6 text-rare-primary" />
                                    </button>
                                </div>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    fullWidth
                                    className="relative z-30"
                                    onClick={() => {
                                        for (let i = 0; i < quantity; i++) {
                                            addItem({
                                                id: product.id,
                                                name: product.name,
                                                price: product.price,
                                                image: product.images?.[0],
                                                slug: product.slug,
                                                weight: product.weight,
                                                dimensions: product.dimensions,
                                            });
                                        }
                                        router.push('/checkout');
                                    }}
                                >
                                    Buy Now
                                </Button>
                            </div>

                            {/* Product Features */}
                            {product.features && product.features.length > 0 && (
                                <Card className="bg-rare-accent/10 border-rare-accent/20">
                                    <h3 className="font-heading text-xl mb-4">Key Features</h3>
                                    <ul className="space-y-2">
                                        {product.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <span className="text-rare-primary mt-1">✓</span>
                                                <span className="text-rare-text">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Related Products */}
                    <div className="mt-16">
                        <h2 className="font-heading text-3xl font-normal text-rare-primary mb-8">
                            Related Products
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Related products would be fetched and displayed here */}
                            <p className="col-span-full text-center text-rare-text-light">Related products coming soon</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
