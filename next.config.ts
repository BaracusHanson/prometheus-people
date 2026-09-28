import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image Docker autonome, déployée sur le VPS (ADR-0009).
  output: "standalone",
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
