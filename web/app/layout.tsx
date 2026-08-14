import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ASK Insurance Broker — Compare & Buy Insurance Online",
  description:
    "Compare 20+ top insurers, get instant quotes, and buy in minutes. Life, Health, Motor, Travel & more. IRDAI licensed broker.",
  keywords: "insurance, compare insurance, life insurance, health insurance, motor insurance, ASK Insurance Broker, India",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "ASK Insurance Broker — Compare & Buy Insurance Online",
    description: "Compare quotes from 20+ top partner insurers with instant digital issuance & 24x7 claim support.",
    url: "https://ask-insurance.vercel.app",
    siteName: "ASK Insurance Broker",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 1200,
        alt: "ASK Insurance Broker Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ASK Insurance Broker",
    description: "Compare & Buy Insurance Online with Instant Quotes",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "InsuranceAgency",
    "name": "ASK Insurance Broker",
    "url": "https://ask-insurance.vercel.app",
    "logo": "https://ask-insurance.vercel.app/logo.jpg",
    "image": "https://ask-insurance.vercel.app/og-image.jpg",
    "description": "IRDAI Licensed Insurance Brokerage in India.",
    "telephone": "+91-1800-ASK-INS",
    "priceRange": "₹482 - ₹1,00,000"
  };

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
