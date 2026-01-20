import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/ui/Hero';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FaShoppingBag, FaSeedling, FaLaptopCode, FaShippingFast, FaBriefcase, FaPumpSoap } from 'react-icons/fa';
import { IconType } from 'react-icons';

const divisions: Array<{
  id: number;
  name: string;
  slug: string;
  Icon: IconType;
  description: string;
  longDescription: string;
  features: string[];
}> = [
    {
      id: 1,
      name: 'Fashion & Beauty',
      slug: 'fashion-beauty',
      Icon: FaShoppingBag,
      description: 'Premium fashion and beauty products including bags, clothing, and accessories',
      longDescription: 'Our Fashion & Beauty division offers a curated selection of premium products that combine style, quality, and innovation. From designer bags and clothing to cutting-edge beauty products, we bring the latest trends and timeless classics to discerning customers worldwide.',
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
      Icon: FaSeedling,
      description: 'Sustainable agriculture, crops, farms, and food logistics',
      longDescription: 'We are committed to sustainable agriculture and food production. Our division focuses on innovative farming techniques, quality crop production, and efficient food logistics to ensure fresh, healthy products reach consumers while supporting local farming communities.',
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
      Icon: FaLaptopCode,
      description: 'Cutting-edge technology and digital transformation services',
      longDescription: 'Our Technology division delivers innovative digital solutions that help businesses transform and thrive in the digital age. From custom software development to cloud solutions and digital strategy, we provide comprehensive technology services.',
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
      Icon: FaShippingFast,
      description: 'Global trade and efficient logistics solutions',
      longDescription: 'We facilitate global trade with efficient logistics solutions that connect businesses across borders. Our expertise in supply chain management, freight forwarding, and customs clearance ensures smooth operations for international commerce.',
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
      Icon: FaBriefcase,
      description: 'Strategic business consulting and investment opportunities',
      longDescription: 'Our consulting division provides strategic guidance to help businesses grow and succeed. We offer comprehensive business consulting services and identify promising investment opportunities across various sectors.',
      features: [
        'Strategic business planning',
        'Market analysis and research',
        'Investment advisory',
        'Mergers and acquisitions support',
      ],
    },
    // New Fragrance Section Added Here
    {
      id: 6,
      name: 'Luxury Fragrance',
      slug: 'fragrance',
      Icon: FaPumpSoap, // Using FaPumpSoap to represent a perfume bottle/dispenser
      description: 'Exquisite perfumes, colognes, and ambient scents for every occasion',
      longDescription: 'Dive into the world of olfactory excellence with our Luxury Fragrance division. We curate and create sophisticated scents that define personality and evoke emotion. From niche artisanal perfumes to globally recognized designer fragrances, we ensure authenticity and elegance in every bottle.',
      features: [
        'Designer perfumes & colognes',
        'Niche & artisanal scents',
        'Home ambience fragrances',
        'Personalized scent consulting',
      ],
    },
  ];

export default function DivisionsPage() {
  return (
    <>
      <Header />

      <main>
        {/* Hero Section */}
        <Hero
          badge="Our Divisions"
          title="Diverse Expertise, Unified Excellence"
          description="Explore our core divisions, each dedicated to delivering exceptional value and innovation in their respective industries."
          centered
        />

        {/* Divisions Grid */}
        <Section background="gradient-soft" padding="lg" withTexture>
          <div className="container">
            <div className="space-y-16">
              {divisions.map((division, index) => {
                const Icon = division.Icon;
                return (
                  <div
                    key={division.id}
                    className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''
                      }`}
                  >
                    <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rare-accent/30 to-rare-primary/20 rounded-full mb-4 shadow-lg">
                        <Icon className="text-3xl text-rare-primary" />
                      </div>
                      <h2 className="font-heading text-3xl md:text-4xl font-normal text-rare-primary mb-4">
                        {division.name}
                      </h2>
                      <p className="font-body text-base md:text-lg text-rare-text-light leading-relaxed mb-6">
                        {division.longDescription}
                      </p>
                      <div className="mb-6">
                        <h3 className="font-heading text-xl font-normal text-rare-primary mb-3">
                          Key Services:
                        </h3>
                        <ul className="space-y-2">
                          {division.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 font-body text-sm text-rare-text-light">
                              <span className="text-rare-primary mt-1">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button href={`/divisions/${division.slug}`} variant="primary">
                        Learn More
                      </Button>
                    </div>

                    <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                      <Card padding="none" className="aspect-square bg-gradient-to-br from-rare-accent/20 to-rare-primary/10 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-rare-primary/5"></div>
                        <Icon className="text-9xl text-rare-primary opacity-20 relative z-10" />
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* CTA Section */}
        <Section background="gradient-blue" padding="lg">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-heading text-3xl md:text-5xl font-normal mb-6">
                Interested in Our Services?
              </h2>
              <p className="font-body text-base md:text-lg mb-8 text-white/90">
                Contact us to learn more about how our divisions can help your business grow
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