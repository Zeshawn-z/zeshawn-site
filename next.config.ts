import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    root: process.cwd(),
  },
  output: 'standalone'
};

export default nextConfig;
