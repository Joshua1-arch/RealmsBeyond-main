import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/ui/Hero';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FaShoppingBag, FaSeedling, FaLaptopCode, FaShippingFast, FaBriefcase, FaPumpSoap } from 'react-icons/fa';
import dbConnect from '@/lib/db';
import Division from '@/lib/models/Division';

const iconMap: Record<string, any> = {
  'fashion-beauty': FaShoppingBag,
  'agriculture-food': FaSeedling,
  'technology': FaLaptopCode,
  'trade-logistics': FaShippingFast,
  'business-consulting': FaBriefcase,
  'fragrance': FaPumpSoap,
};

async function getDivisions() {
  try {
    await dbConnect();
    const divisions = await Division.find().sort({ order: 1 }).lean();
    return JSON.parse(JSON.stringify(divisions));
  } catch (error) {
    console.error('Error fetching divisions:', error);
    return [];
  }
}

export default async function Home() {
  const dbDivisions = await getDivisions();

  // Merge or fallback to static if DB is empty
  const displayDivisions = dbDivisions.length > 0 ? dbDivisions.map((d: any) => ({
    id: d._id,
    name: d.name,
    description: d.description,
    href: '/divisions',
    Icon: iconMap[d.slug] || FaBriefcase
  })) : [
    { id: 1, name: 'Fashion & Beauty', Icon: FaShoppingBag, description: 'Premium fashion and beauty products including bags, clothing, and accessories', href: '/divisions' },
    { id: 2, name: 'Agriculture & Food', Icon: FaSeedling, description: 'Sustainable agriculture, crops, farms, and food logistics', href: '/divisions' },
    { id: 3, name: 'Technology & Digital Solutions', Icon: FaLaptopCode, description: 'Cutting-edge technology and digital transformation services', href: '/divisions' },
    { id: 4, name: 'Trade & Logistics', Icon: FaShippingFast, description: 'Global trade and efficient logistics solutions', href: '/divisions' },
    { id: 5, name: 'Business Consulting & Investments', Icon: FaBriefcase, description: 'Strategic business consulting and investment opportunities', href: '/divisions' },
    { id: 6, name: 'Luxury Fragrance', Icon: FaPumpSoap, description: 'Exquisite perfumes, colognes, and ambient scents for every occasion', href: '/divisions' },
  ];
  return (
    <>
      <Header />

      <main>
        {/* Hero Section */}
        <Hero
          badge="Welcome to Beyond Realms"
          title="Transcending Boundaries. Building Realms."
          description="A multi-sector conglomerate operating in Fashion & Beauty, Agriculture & Food, Technology & Digital Solutions, Trade & Logistics, Business Consulting, and Luxury Fragrance."
          buttonText="Learn More"
          buttonHref="/about"
          secondaryButtonText="Explore Our Divisions"
          secondaryButtonHref="/divisions"
          backgroundImage="/Background.jpg"
          centered
        />

        {/* Introduction Section */}
        <Section background="gradient-soft" padding="lg" withTexture>
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-heading text-3xl md:text-5xl font-normal text-rare-primary mb-6">
                Building Excellence Across Industries
              </h2>
              <p className="font-body text-base md:text-lg text-rare-text-light leading-relaxed">
                Beyond Realms LTD is a dynamic conglomerate that transcends traditional business boundaries.
                We operate across multiple sectors, bringing innovation, quality, and excellence to everything we do.
                From premium fashion to sustainable agriculture, cutting-edge technology to global trade,
                we are committed to building realms of opportunity and growth.
              </p>
            </div>
          </div>
        </Section>

        {/* Featured Sectors Section */}
        <Section background="white" padding="lg">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-5xl font-normal text-rare-primary mb-4">
                Our Divisions
              </h2>
              <p className="font-body text-base md:text-lg text-rare-text-light max-w-2xl mx-auto">
                Explore our diverse portfolio of business divisions, each dedicated to excellence and innovation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {displayDivisions.map((division: any) => {
                const Icon = division.Icon;
                return (
                  <Card key={division.id} hover padding="lg" href={division.href}>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-rare-accent/20 rounded-full mb-4">
                        <Icon className="text-3xl text-rare-primary" />
                      </div>
                      <h3 className="font-heading text-xl md:text-2xl font-normal text-rare-primary mb-3">
                        {division.name}
                      </h3>
                      <p className="font-body text-sm text-rare-text-light mb-4">
                        {division.description}
                      </p>
                      <span className="text-xs font-body font-normal tracking-rare-nav uppercase text-rare-primary hover:opacity-70 transition-opacity">
                        Learn More →
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Button href="/divisions" variant="primary" size="lg">
                Explore All Divisions
              </Button>
            </div>
          </div>
        </Section>

        {/* CTA Section */}
        <Section background="gradient-blue" padding="lg">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-heading text-3xl md:text-5xl font-normal mb-6">
                Ready to Partner with Us?
              </h2>
              <p className="font-body text-base md:text-lg mb-8 text-white/90">
                Discover how Beyond Realms LTD can help transform your business and unlock new opportunities
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button href="/contact" variant="primary" size="lg" className="bg-rare-accent text-rare-primary hover:bg-rare-accent/90">
                  Get in Touch
                </Button>
                <Button href="/products" variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  View Products
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