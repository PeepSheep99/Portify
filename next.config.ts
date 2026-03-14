import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy to Python backend on port 8000 for local dev
    return [
      {
        source: '/api/transfer',
        destination: 'http://localhost:8000/api/transfer',
      },
    ];
  },
};

export default nextConfig;
