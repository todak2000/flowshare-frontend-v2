import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Cloud Run!
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
