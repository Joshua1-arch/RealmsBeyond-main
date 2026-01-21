'use client';

import { useMemo, useState } from 'react';
import { Hero } from '@/components/ui/Hero';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MdEvent, MdPerson, MdLocalOffer, MdLocalOffer as MdTag } from 'react-icons/md';
import { FiCalendar, FiUser } from 'react-icons/fi';
// import { BlogPost } from '@/types/blog'; // We might need to define this or infer it

export type BlogPostType = {
    id: string;
    _id?: string;
    title: string;
    category: string;
    excerpt: string;
    author: string;
    published: boolean;
    published_at?: string;
    tags?: string[];
    slug?: string;
};

type NewsletterStatus = 'idle' | 'loading' | 'success' | 'error';

interface BlogListProps {
    initialPosts: BlogPostType[];
}

export default function BlogList({ initialPosts }: BlogListProps) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState<NewsletterStatus>('idle');

    const categories = useMemo(() => {
        const cats = Array.from(new Set(initialPosts.map((p) => p.category).filter(Boolean)));
        return ['All', ...cats];
    }, [initialPosts]);

    const filteredPosts = initialPosts.filter(
        (post) => selectedCategory === 'All' || post.category === selectedCategory,
    );

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        try {
            setSubscribeStatus('loading');

            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                throw new Error('Subscription failed');
            }

            setSubscribeStatus('success');
            setEmail('');
        } catch (err) {
            console.error('Newsletter subscription error:', err);
            setSubscribeStatus('error');
        } finally {
            setTimeout(() => setSubscribeStatus('idle'), 4000);
        }
    };

    return (
        <main>
            {/* Hero Section */}
            <Hero
                badge="Insights & News"
                title="Stay Informed"
                description="Discover the latest insights, trends, and news from across our divisions"
                centered
            />

            {/* Newsletter Section */}
            <Section background="alt" padding="md">
                <div className="container">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="font-heading text-2xl md:text-3xl font-normal text-rare-primary mb-4">
                            Subscribe to Our Newsletter
                        </h2>
                        <p className="font-body text-sm md:text-base text-rare-text-light mb-6">
                            Get the latest insights and updates delivered to your inbox
                        </p>
                        <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                fullWidth
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                className="sm:w-auto whitespace-nowrap"
                                disabled={subscribeStatus === 'loading'}
                            >
                                {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                            </Button>
                        </form>
                        {subscribeStatus === 'success' && (
                            <p className="mt-3 text-sm text-green-600">
                                Thank you for subscribing! Please check your inbox for confirmation.
                            </p>
                        )}
                        {subscribeStatus === 'error' && (
                            <p className="mt-3 text-sm text-red-600">
                                Subscription failed. Please try again.
                            </p>
                        )}
                    </div>
                </div>
            </Section>

            {/* Category Filter */}
            <Section background="default" padding="sm">
                <div className="container">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-lg text-xs font-body font-normal tracking-rare-nav uppercase whitespace-nowrap transition-all ${selectedCategory === category
                                    ? 'bg-rare-primary text-white'
                                    : 'bg-white text-rare-primary hover:bg-rare-primary-light border border-rare-border'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </Section>

            {/* Blog Posts Grid */}
            <Section background="gradient-soft" padding="lg" withTexture>
                <div className="container">
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="font-body text-lg text-rare-text-light">
                                No articles found in this category yet. Please check back soon.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {filteredPosts.map((post) => (
                                <Card key={post.id || post._id} hover padding="none">
                                    <div className="aspect-video bg-gradient-to-br from-rare-accent/30 to-rare-primary/10 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                        {(post as any).featured_image ? (
                                            <img
                                                src={(post as any).featured_image}
                                                alt={post.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full relative z-10">
                                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-rare-primary/10"></div>
                                                <div className="w-full h-full bg-gradient-to-br from-rare-accent/20 to-rare-primary/5"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs font-body text-rare-text-light uppercase tracking-wide">
                                                {post.category}
                                            </span>
                                        </div>
                                        <h3 className="font-heading text-xl md:text-2xl font-normal text-rare-primary mb-3">
                                            {post.title}
                                        </h3>
                                        <p className="font-body text-sm text-rare-text-light mb-4 line-clamp-3">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-rare-text-light mb-4">
                                            <div className="flex items-center gap-1">
                                                <FiUser className="h-4 w-4" />
                                                <span>{post.author}</span>
                                            </div>
                                            {post.published_at && (
                                                <div className="flex items-center gap-1">
                                                    <FiCalendar className="h-4 w-4" />
                                                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {post.tags?.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-rare-primary-light text-rare-primary text-xs rounded"
                                                >
                                                    <MdTag className="h-3 w-3" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <Button variant="outline" size="sm" fullWidth href={post.slug ? `/blog/${post.slug}` : '#'}>
                                            Read More
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Section>
        </main>
    );
}
