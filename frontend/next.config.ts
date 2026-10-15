import type { NextConfig } from "next";

// In the single-container deployment the NestJS backend listens on localhost
// only; the browser reaches it through this same-origin path (/backend/*),
// which the login proxy (src/proxy.ts) also protects.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Uploads (up to 25 MiB) pass through the proxy; the default limit is 10 MB.
    proxyClientMaxBodySize: "30mb",
  },
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${BACKEND_INTERNAL_URL}/:path*` }];
  },
};

export default nextConfig;
