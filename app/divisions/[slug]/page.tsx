import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/ui/Hero';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import dbConnect from '@/lib/db';
import DivisionModel from '@/lib/models/Division';
import ProductModel from '@/lib/models/Product';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 60;

const fallbackDivisions = [
  {
    id: 1,
    name: 'Fashion & Beauty',
    slug: 'fashion-beauty',
    description: 'Premium fashion and beauty products including bags, clothing, and accessories',
    content: 'Our Fashion & Beauty division offers a curated selection of premium products that combine style, quality, and innovation. From designer bags and clothing to cutting-edge beauty products, we bring the latest trends and timeless classics to discerning customers worldwide. We believe that fashion is not just about clothing, but a form of expression that empowers individuals. Our collections are sourced from top designers and sustainable brands, ensuring that you not only look good but feel good about your choices.',
    features: [
      'Designer bags and accessories',
      'Premium clothing collections',
      'Beauty and cosmetics',
      'Sustainable fashion options',
    ],
  },
  {
    id: 2,
    name: 'Agriculture & Food',
    slug: 'agriculture-food',
    description: 'Sustainable agriculture, crops, farms, and food logistics',
    content: 'We are committed to sustainable agriculture and food production. Our division focuses on innovative farming techniques, quality crop production, and efficient food logistics to ensure fresh, healthy products reach consumers while supporting local farming communities. By leveraging modern technology and traditional wisdom, we optimize crop yields and minimize environmental impact. Our logistics network ensures that produce travels from farm to table with maximum freshness.',
    features: [
      'Sustainable farming practices',
      'Quality crop production',
      'Farm management services',
      'Food logistics and distribution',
    ],
  },
  {
    id: 3,
    name: 'Technology & Digital Solutions',
    slug: 'technology',
    description: 'Cutting-edge technology and digital transformation services',
    content: 'Our Technology division delivers innovative digital solutions that help businesses transform and thrive in the digital age. From custom software development to cloud solutions and digital strategy, we provide comprehensive technology services. We partner with organizations to identify their unique challenges and craft tailored digital roadmaps. Whether it is building a robust e-commerce platform or implementing AI-driven analytics, our experts are at the forefront of technological advancement.',
    features: [
      'Custom software development',
      'Cloud solutions and infrastructure',
      'Digital transformation consulting',
      'Mobile and web applications',
    ],
  },
  {
    id: 4,
    name: 'Trade & Logistics',
    slug: 'trade-logistics',
    description: 'Global trade and efficient logistics solutions',
    content: 'We facilitate global trade with efficient logistics solutions that connect businesses across borders. Our expertise in supply chain management, freight forwarding, and customs clearance ensures smooth operations for international commerce. In an increasingly interconnected world, we bridge the gap between markets, providing reliable and cost-effective shipping solutions. Our dedicated team navigates complex regulations to deliver your goods on time, every time.',
    features: [
      'International freight forwarding',
      'Supply chain management',
      'Customs clearance services',
      'Warehousing and distribution',
    ],
  },
  {
    id: 5,
    name: 'Business Consulting & Investments',
    slug: 'business-consulting',
    description: 'Strategic business consulting and investment opportunities',
    content: 'Our consulting division provides strategic guidance to help businesses grow and succeed. We offer comprehensive business consulting services and identify promising investment opportunities across various sectors. Our approach is data-driven and results-oriented. We work closely with leadership teams to refine strategies, optimize operations, and unlock hidden value. From startups to established enterprises, we empower businesses to achieve their full potential.',
    features: [
      'Strategic business planning',
      'Market analysis and research',
      'Investment advisory',
      'Mergers and acquisitions support',
    ],
  },
  {
    id: 6,
    name: 'Luxury Fragrance',
    slug: 'fragrance',
    description: 'Exquisite perfumes, colognes, and ambient scents for every occasion',
    content: 'Dive into the world of olfactory excellence with our Luxury Fragrance division. We curate and create sophisticated scents that define personality and evoke emotion. From niche artisanal perfumes to globally recognized designer fragrances, we ensure authenticity and elegance in every bottle. Our collection spans a wide range of notes, from fresh and citrusy to deep and woods, catering to every preference. We also offer personalized consultations to help you find your signature scent.',
    features: [
      'Designer perfumes & colognes',
      'Niche & artisanal scents',
      'Home ambience fragrances',
      'Personalized scent consulting',
    ],
  },
];

export async function generateStaticParams() {
  await dbConnect();
  try {
    const divisions = await DivisionModel.find({}, 'slug').lean();
    const dbSlugs = divisions.map((division: any) => ({
      slug: division.slug,
    }));

    // Combine DB slugs with fallback slugs, avoiding duplicates
    const fallbackSlugs = fallbackDivisions.map(d => ({ slug: d.slug }));
    const allSlugs = [...dbSlugs];

    fallbackSlugs.forEach(fs => {
      if (!allSlugs.some(ds => ds.slug === fs.slug)) {
        allSlugs.push(fs);
      }
    });

    return allSlugs;
  } catch (error) {
    console.error('Error generating static params for divisions:', error);
    return fallbackDivisions.map(d => ({ slug: d.slug }));
  }
}

async function getDivisionData(slug: string) {
  try {
    await dbConnect();
    let division: any = await DivisionModel.findOne({ slug }).lean();

    // Use fallback content if not in DB or if DB record is sparse
    const fallback = fallbackDivisions.find(d => d.slug === slug);

    if (division) {
      // Merge DB data with fallback content/features if missing in DB
      // This ensures 'content' and 'features' exist for the view
      if (!division.content && fallback) {
        division.content = fallback.content;
      }
      if (!division.features && fallback) {
        division.features = fallback.features;
      }
    } else if (fallback) {
      division = fallback;
    }

    if (!division) return null;

    return {
      division: JSON.parse(JSON.stringify(division)),
    };
  } catch (error) {
    console.error('Error fetching division data:', error);
    const fallback = fallbackDivisions.find(d => d.slug === slug);
    if (fallback) {
      return {
        division: fallback,
      };
    }
    return null;
  }
}

export default async function DivisionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getDivisionData(slug);

  if (!data) {
    notFound();
  }

  const { division } = data;

  return (
    <>
      <Header />

      <main>
        <Hero
          badge="Our Divisions"
          title={division.name}
          description={division.description}
          centered
        />

        <Section background="white" padding="lg">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              {/* Blog Style Content */}
              <div className="prose prose-lg max-w-none text-rare-text-light mb-12">
                <h2 className="font-heading text-3xl text-rare-primary mb-6">About {division.name}</h2>
                <div className="space-y-6 text-lg leading-relaxed">
                  {/* Render content as paragraphs if possible, or just text */}

                  {(division.content || division.description).split('\n').map((paragraph: string, idx: number) => (
                    <p key={idx}>{paragraph}</p>
                  ))}

                </div>

                {division.features && division.features.length > 0 && (
                  <div className="mt-12 p-8 bg-rare-surface rounded-xl border border-rare-border">
                    <h3 className="font-heading text-2xl text-rare-primary mb-6">Key Services & Highlights</h3>
                    <ul className="grid md:grid-cols-2 gap-4">
                      {division.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-rare-primary mt-1 text-xl">✓</span>
                          <span className="text-rare-text-light font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>

            <div className="text-center mt-12 pt-12 border-t border-gray-100">
              <h3 className="font-heading text-2xl text-rare-primary mb-6">Want to learn more?</h3>
              <div className="flex gap-4 justify-center">
                <Button href="/contact" variant="primary">
                  Contact Us
                </Button>
                <Button href="/divisions" variant="outline">
                  Back to Divisions
                </Button>
              </div>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}
