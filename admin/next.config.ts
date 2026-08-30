import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ask/shared"],
  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
