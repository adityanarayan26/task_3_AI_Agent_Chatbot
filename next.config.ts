import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright must not be bundled for client-side — keep it server-only
  serverExternalPackages: ['playwright', 'playwright-core'],

  // Allow images from external domains if needed later
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
