import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ask/shared"],
  async rewrites() {
    // Only apply external admin rewrite if ADMIN_URL is explicitly set
    if (process.env.ADMIN_URL) {
      return [
        {
          source: "/admin-portal",
          destination: `${process.env.ADMIN_URL}/dashboard`,
        },
        {
          source: "/admin-portal/:path*",
          destination: `${process.env.ADMIN_URL}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
