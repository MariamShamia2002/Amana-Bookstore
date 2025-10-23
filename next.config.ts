import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Unblock production builds on Vercel by skipping ESLint errors during `next build`
  // Keep running `pnpm run lint` locally/CI to catch issues pre-merge.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
