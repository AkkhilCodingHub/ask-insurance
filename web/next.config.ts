import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ask/shared"],
  async rewrites() {
    if (!process.env.ADMIN_URL) return [];
    const adminUrl = process.env.ADMIN_URL.trim().replace(/\/$/, '');
    return [
      {
        source: "/admin",
        destination: `${adminUrl}/`,
      },
      {
        source: "/admin/:path*",
        destination: `${adminUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
