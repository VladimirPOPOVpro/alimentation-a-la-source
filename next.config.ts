import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Autorise n'importe quel hôte https : les marchands sont ajoutés à la
    // main par la mère de Vladimir via data/marchands.json et peuvent
    // référencer une photo hébergée n'importe où (imgur, site officiel, etc).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
