import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ask/shared"],
  async rewrites() {
    return [
      {
        source: "/admin-portal",
        destination: process.env.ADMIN_URL || "http://localhost:3001/dashboard",
      },
      {
        source: "/admin-portal/:path*",
        destination: `${process.env.ADMIN_URL || "http://localhost:3001"}/:path*`,
      },
    ];
  },
};

export default nextConfig;

