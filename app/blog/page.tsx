
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import dbConnect from '@/lib/db';
import BlogPostModel from '@/lib/models/BlogPost';
import BlogList from '@/components/blog/BlogList';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export const metadata = {
  title: 'Blog | Beyond Realms',
  description: 'Latest insights, news, and updates from Beyond Realms across our various divisions.',
};


export default async function BlogPage() {
  await dbConnect();

  let postsObj = [];
  try {
    const posts = await BlogPostModel.find({ published: true }).sort({ published_at: -1 }).lean();
    postsObj = JSON.parse(JSON.stringify(posts));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
  }

  return (
    <>
      <Header />
      <BlogList initialPosts={postsObj} />
      <Footer />
    </>
  );
}
