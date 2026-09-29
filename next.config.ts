import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image Docker autonome, déployée sur le VPS (ADR-0009).
  output: "standalone",
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },

  // Pages du candidat (ADR-0021) : le lien porte un jeton secret. Il ne doit fuiter ni
  // vers un autre site (Referer), ni dans un moteur de recherche. Ces pages sont
  // dynamiques : Next.js interdit déjà leur mise en cache.
  headers() {
    const protections = [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ];
    return Promise.resolve([
      { source: "/passation", headers: protections },
      { source: "/passation/:chemin*", headers: protections },
    ]);
  },
};

export default nextConfig;
