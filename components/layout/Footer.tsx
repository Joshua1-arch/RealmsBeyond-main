'use client';

import React from 'react';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Our Divisions', href: '/divisions' },

  ],
  services: [
    { name: 'Fashion & Beauty', href: '/divisions/fashion-beauty' },
    { name: 'Agriculture & Food', href: '/divisions/agriculture-food' },
    { name: 'Technology', href: '/divisions/technology' },
    { name: 'Trade & Logistics', href: '/divisions/trade-logistics' },
  ],
  support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
};

const socialLinks = [
  { name: 'Facebook', icon: FaFacebook, href: '#' },
  { name: 'Instagram', icon: FaInstagram, href: '#' },
  { name: 'Twitter', icon: FaTwitter, href: '#' },
  { name: 'LinkedIn', icon: FaLinkedin, href: '#' },
];

import { useSiteSettings } from '@/hooks/useSiteSettings';

export const Footer: React.FC = () => {
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-gradient-blue text-white font-body" >
      <div className="py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <h3 className="font-heading text-2xl font-bold mb-4">
                <div className="flex-shrink-0">
                  <Link href="/" className="block">
                    <img
                      src={settings?.logo_url || "/logo.png"}
                      alt={settings?.site_name || "Beyond Realms Logo"}
                      className={`h-10 w-auto transition-transform duration-300`}
                    />
                  </Link>
                </div>
              </h3>
              <p className="text-sm text-white/80 mb-6">
                Transcending Boundaries. Building Realms.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  // Map social names to settings keys
                  const socialKey = `social_${social.name.toLowerCase()}`;
                  const href = settings?.[socialKey] || social.href;

                  return (
                    <a
                      key={social.name}
                      href={href}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      aria-label={social.name}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-heading text-sm uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-white/80 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Links */}
            <div>
              <h4 className="font-heading text-sm uppercase tracking-wider mb-4">Our Divisions</h4>
              <ul className="space-y-2 text-sm">
                {footerLinks.services.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-white/80 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-heading text-sm uppercase tracking-wider mb-4">Contact Us</h4>
              <div className="space-y-3 text-sm text-white/80">
                {settings?.address && (
                  <div className="flex items-start gap-2">
                    <FiMapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{settings.address}</span>
                  </div>
                )}
                {settings?.contact_phone && (
                  <div className="flex items-center gap-2">
                    <FiPhone className="h-5 w-5 flex-shrink-0" />
                    <a href={`tel:${settings.contact_phone}`} className="hover:text-white transition-colors">
                      {settings.contact_phone}
                    </a>
                  </div>
                )}
                {settings?.contact_email && (
                  <div className="flex items-center gap-2">
                    <FiMail className="h-5 w-5 flex-shrink-0" />
                    <a href={`mailto:${settings.contact_email}`} className="hover:text-white transition-colors">
                      {settings.contact_email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="py-6 border-t border-white/10">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/70">
            <p>&copy; {new Date().getFullYear()} {settings?.site_name || 'Beyond Realms LTD'}. All rights reserved.</p>
            <div className="flex gap-6">
              {footerLinks.support.slice(2).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
