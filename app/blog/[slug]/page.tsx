import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import dbConnect from '@/lib/db';
import BlogPostModel from '@/lib/models/BlogPost';
import { Hero } from '@/components/ui/Hero';
import { Section } from '@/components/ui/Section';
import { FiCalendar, FiUser, FiClock, FiArrowLeft } from 'react-icons/fi';
import { MdLocalOffer as MdTag } from 'react-icons/md';
import Link from 'next/link';
import BlogPostHeader from '@/components/blog/BlogPostHeader';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    await dbConnect();
    const slug = (await params).slug;
    const post = await BlogPostModel.findOne({ slug, published: true }).lean();

    if (!post) {
        return {
            title: 'Blog Post Not Found',
        };
    }

    return {
        title: `${post.title} | Beyond Realms`,
        description: post.excerpt || post.content.substring(0, 160),
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: post.featured_image ? [post.featured_image] : [],
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    await dbConnect();
    const slug = (await params).slug;
    const post = await BlogPostModel.findOne({ slug, published: true }).lean();

    if (!post) {
        notFound();
    }

    // Parse JSON safe
    const postData = JSON.parse(JSON.stringify(post));

    return (
        <>
            <Header />
            <main>
                {/* Helper function to format date */}
                {/* Simple inline Hero or specific design */}
                <BlogPostHeader post={postData} />

                <Section background="default" padding="lg">
                    <div className="container max-w-3xl mx-auto">
                        <div className="prose prose-lg prose-headings:font-heading prose-headings:text-rare-primary prose-a:text-blue-600 hover:prose-a:text-blue-500 max-w-none">
                            {/* If users use Markdown or HTML, we should render accordingly. 
                    For now assuming plain text or simple HTML injected safely or handled by react. 
                    Ideally use a markdown renderer (like react-markdown). 
                    Here we'll just dump content with whitespace preserved if it's plain text,
                    or dangerouslySetInnerHTML if we trust admin input (common in simple CMS)
                */}
                            <div className="whitespace-pre-wrap font-body text-rare-text leading-relaxed">
                                {postData.content}
                            </div>
                        </div>

                        {/* Tags */}
                        {postData.tags && postData.tags.length > 0 && (
                            <div className="mt-12 flex flex-wrap gap-2 pt-8 border-t border-gray-100">
                                {postData.tags.map((tag: string) => (
                                    <span key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full text-sm">
                                        <MdTag className="w-3.5 h-3.5" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </Section>
            </main>
            <Footer />
        </>
    );
}
