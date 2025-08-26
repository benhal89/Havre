// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Don’t fail production builds because of ESLint errors
    ignoreDuringBuilds: true,
  },
  // optional: if you ever get TS errors blocking builds, you can temporarily add:
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;