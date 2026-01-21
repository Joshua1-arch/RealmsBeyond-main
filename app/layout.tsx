import type { Metadata } from "next";
import { Cormorant, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beyond Realms LTD - Transcending Boundaries. Building Realms.",
  description: "Beyond Realms LTD is a multi-sector conglomerate operating in Fashion & Beauty, Agriculture & Food, Technology & Digital Solutions, Trade & Logistics, and Business Consulting & Investments.",
  keywords: ["fashion", "beauty", "agriculture", "technology", "trade", "business consulting", "investments"],
  authors: [{ name: "Beyond Realms LTD" }],
  openGraph: {
    title: "Beyond Realms LTD - Transcending Boundaries. Building Realms.",
    description: "Multi-sector conglomerate operating in Fashion, Agriculture, Technology, Trade, and Business Development.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Beyond Realms LTD",
    description: "Transcending Boundaries. Building Realms.",
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
