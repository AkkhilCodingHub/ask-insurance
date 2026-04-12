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
    "Compare 38+ insurers, get instant quotes, and buy in minutes. Life, Health, Motor, Travel & more. IRDAI licensed broker.",
  keywords: "insurance, compare insurance, life insurance, health insurance, motor insurance, India",
  openGraph: {
    title: "ASK Insurance Broker",
    description: "Insurance that actually works for you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
