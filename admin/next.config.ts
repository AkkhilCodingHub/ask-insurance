import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ask/shared"],
  basePath: "/admin",
};

export default nextConfig;
