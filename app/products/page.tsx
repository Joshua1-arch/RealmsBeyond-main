'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MdSearch, MdFilterList, MdCheckCircle } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useCart } from '@/contexts/CartContext';

interface Division {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  images: string[];
  category?: string;
  division_id?: string;
  in_stock: boolean;
  featured: boolean;
  division?: {
    name: string;
    slug: string;
  };
}

function ProductsContent() {
  const { addItem } = useCart();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);

  // Update searchQuery if URL param changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [divRes, prodRes] = await Promise.all([
          fetch('/api/divisions'),
          fetch('/api/products?in_stock=true')
        ]);

        if (!divRes.ok) throw new Error('Failed to fetch divisions');
        if (!prodRes.ok) throw new Error('Failed to fetch products');

        const [divData, prodData] = await Promise.all([
          divRes.json(),
          prodRes.json()
        ]);

        setDivisions(divData);
        const rawProducts = prodData.products || (Array.isArray(prodData) ? prodData : []);
        const productsWithIds = rawProducts.map((product: any) => ({
          ...product,
          id: product._id || product.id,
        }));
        setProducts(productsWithIds);
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError('Unable to load products right now. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get unique categories from products and divisions
  const categories = ['All', ...divisions.map((div) => div.name)];

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      product.division?.name === selectedCategory ||
      product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Header />

      <main className="min-h-screen bg-rare-background">
        {/* Hero Section */}
        <Section background="gradient-soft" padding="lg">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-heading text-4xl md:text-5xl font-normal text-rare-primary mb-4">
                Products & Services
              </h1>
              <p className="font-body text-lg text-rare-text-light">
                Explore our diverse range of products and services across all divisions
              </p>
            </div>
          </div>
        </Section>

        {/* Filters Section */}
        <Section background="white" padding="md">
          <div className="container">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-2xl mx-auto">
                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-rare-text-light" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-rare-border rounded-lg font-body text-rare-text placeholder:text-rare-text-light/50 focus:outline-none focus:ring-2 focus:ring-rare-primary focus:border-transparent bg-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <MdFilterList className="h-5 w-5 text-rare-text-light" />
                <span className="font-body text-sm text-rare-text-light uppercase tracking-wide">
                  Filter by Category
                </span>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-body font-normal uppercase tracking-rare-nav whitespace-nowrap transition-all border ${selectedCategory === category
                      ? 'bg-rare-primary text-white border-rare-primary'
                      : 'bg-white text-rare-primary border-rare-border hover:bg-rare-primary-light hover:border-rare-primary'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Products Grid */}
        <Section background="gradient-soft" padding="lg" withTexture>
          <div className="container">
            {/* Results Count */}
            {!loading && !error && (
              <div className="mb-8 text-center">
                <p className="font-body text-sm text-rare-text-light">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                  {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <AiOutlineLoading3Quarters className="h-8 w-8 animate-spin text-rare-primary" />
                <span className="ml-3 font-body text-rare-text-light">Loading products...</span>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="font-body text-lg text-red-600 mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="primary"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-body text-lg text-rare-text-light mb-2">
                  No products found
                </p>
                <p className="font-body text-sm text-rare-text-light mb-6">
                  Try adjusting your search or filter criteria
                </p>
                {(searchQuery || selectedCategory !== 'All') && (
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredProducts.map((product) => (
                  <Card key={product.id} hover padding="none" className="relative group cursor-pointer overflow-hidden">
                    {/* Product Image */}
                    <Link href={`/products/${product.slug}`} className="block">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.images?.[0] || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-6 bg-white">
                      <div className="mb-2">
                        <span className="text-xs font-body text-rare-text-light uppercase tracking-wide">
                          {product.division?.name || product.category || 'Product'}
                        </span>
                      </div>
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-heading text-xl font-normal text-rare-primary mb-3 hover:text-rare-secondary transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="font-body text-xl font-semibold text-rare-primary">
                          ₦{product.price.toLocaleString()}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="font-body text-sm text-rare-text-light line-through">
                            ₦{product.compare_at_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          onClick={() => {
                            addItem({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.images?.[0],
                              slug: product.slug,
                            });
                            setAddedToCartId(product.id);
                            setTimeout(() => setAddedToCartId(null), 2000);
                          }}
                          className="flex-1"
                        >
                          {addedToCartId === product.id ? (
                            <>
                              <MdCheckCircle className="h-4 w-4 mr-2" />
                              Added!
                            </>
                          ) : (
                            'Add to Cart'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          href={`/products/${product.slug}`}
                          className="flex-shrink-0"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* CTA Section */}
        <Section background="alt" padding="lg">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-heading text-3xl md:text-5xl font-normal text-rare-primary mb-6">
                Need Custom Solutions?
              </h2>
              <p className="font-body text-base md:text-lg text-rare-text-light mb-8">
                Contact us for tailored products and services that meet your specific needs
              </p>
              <Button href="/contact" variant="primary" size="lg">
                Get in Touch
              </Button>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-rare-background flex items-center justify-center">
        <AiOutlineLoading3Quarters className="h-8 w-8 animate-spin text-rare-primary" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
