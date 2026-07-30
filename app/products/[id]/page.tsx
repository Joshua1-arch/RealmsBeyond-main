
import { notFound } from 'next/navigation';
import ProductModel from '@/lib/models/Product';
import dbConnect from '@/lib/db';
import ProductView from '@/components/products/ProductView';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

// Generate static params for all products (SSG)

export async function generateStaticParams() {
  try {
    await dbConnect();
    const products = await ProductModel.find({}, 'slug _id').lean();

    const params = [];
    for (const product of products) {
      if (product.slug) {
        params.push({ id: product.slug });
      }
      // Also generate for ID just in case
      params.push({ id: product._id.toString() });
    }

    return params;
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await dbConnect();

  let productDoc;
  try {
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      productDoc = await ProductModel.findById(id).lean();
    } else {
      productDoc = await ProductModel.findOne({ slug: id }).lean();
    }
  } catch (error) {
    console.error('Error fetching product:', error);
  }

  if (!productDoc) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Button href="/products" variant="primary">Back to Products</Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Serialize the Mongoose document to a plain object
  const product = {
    id: productDoc._id.toString(),
    name: productDoc.name,
    description: productDoc.description || '',
    price: productDoc.price,
    compare_at_price: productDoc.compare_at_price,
    images: productDoc.images || [],
    category: productDoc.category,
    in_stock: productDoc.in_stock,
    // Provide defaults for fields that might be missing in DB but required by UI
    rating: 0,
    reviews: 0,
    sku: productDoc.sku || '',
    slug: productDoc.slug,
    weight: productDoc.weight || '',
    dimensions: productDoc.dimensions || '',
    features: productDoc.features || [],
  };

  return <ProductView product={product} />;
}
