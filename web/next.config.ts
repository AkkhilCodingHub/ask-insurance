import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ask/shared"],
  async rewrites() {
    const adminUrl = process.env.ADMIN_URL || "https://ask-insurance-admin-blue.vercel.app";
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
