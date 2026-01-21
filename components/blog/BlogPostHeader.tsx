'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCalendar, FiUser, FiArrowLeft } from 'react-icons/fi';

interface BlogPostHeaderProps {
    post: {
        title: string;
        category?: string;
        author?: string;
        published_at?: string | Date;
        featured_image?: string;
    };
}

export default function BlogPostHeader({ post }: BlogPostHeaderProps) {
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 },
        },
    };

    const imageVariants: any = {
        hidden: { opacity: 0, scale: 1.1 },
        visible: {
            opacity: 0.4, // Reduced opacity as it is an overlay
            scale: 1,
            transition: { duration: 1.2 },
        },
    };

    return (
        <div className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-rare-primary">
            {/* Background Image/Overlay */}
            {post.featured_image && (
                <>
                    <motion.div
                        className="absolute inset-0 z-0"
                        initial="hidden"
                        animate="visible"
                        variants={imageVariants}
                    >
                        <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                    <div className="absolute inset-0 z-0 bg-gradient-to-t from-rare-primary via-rare-primary/80 to-transparent"></div>
                </>
            )}

            <div className="container relative z-10 max-w-4xl mx-auto px-6">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants}>
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors text-sm font-medium group"
                        >
                            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Blog
                        </Link>
                    </motion.div>

                    {/* Category Tag */}
                    <motion.div variants={itemVariants} className="mb-4">
                        <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                            {post.category || 'News'}
                        </span>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        variants={itemVariants}
                        className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight mb-8 drop-shadow-sm"
                    >
                        {post.title}
                    </motion.h1>

                    {/* Meta Info (Author & Date) */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-wrap items-center gap-6 text-white/80 text-sm font-body border-t border-white/10 pt-6"
                    >
                        <div className="flex items-center gap-3 bg-white/5 py-2 px-4 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-rare-accent/20 flex items-center justify-center text-rare-accent">
                                <FiUser className="w-4 h-4" />
                            </div>
                            <span className="font-medium tracking-wide">{post.author || 'Admin'}</span>
                        </div>

                        {post.published_at && (
                            <div className="flex items-center gap-3 bg-white/5 py-2 px-4 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-rare-accent/20 flex items-center justify-center text-rare-accent">
                                    <FiCalendar className="w-4 h-4" />
                                </div>
                                <span className="font-medium tracking-wide">
                                    {new Date(post.published_at).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
