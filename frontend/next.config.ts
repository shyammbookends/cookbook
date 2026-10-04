import type { NextConfig } from "next";
// Updated theme cache reload

const nextConfig: NextConfig = {
  // Recipe images are pre-processed into AVIF/WebP variants by the media
  // pipeline (src/server/media/pipeline.ts) and served as plain <picture>
  // elements — no on-the-fly Next Image optimization needed.
  images: { unoptimized: true },

  // /api/pdf launches @sparticuz/chromium, which loads its compressed browser from
  // its own bin/ folder at runtime — file tracing can't see that, so ship it explicitly.
  // (Paths are relative to this folder; node_modules lives one level up.)
  outputFileTracingIncludes: {
    "/api/pdf": ["../node_modules/@sparticuz/chromium/bin/**"],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    // Optimise heavy barrel-export packages by tree-shaking to named imports only.
    optimizePackageImports: [
      "motion/react",
      "motion",
      "@react-three/fiber",
      "@react-three/drei",
      "three",
      "lucide-react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
