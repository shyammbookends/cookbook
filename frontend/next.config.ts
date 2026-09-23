import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Recipe images are pre-processed into AVIF/WebP variants by the media
  // pipeline (src/server/media/pipeline.ts) and served as plain <picture>
  // elements — no on-the-fly Next Image optimization needed.
  images: { unoptimized: true },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
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
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
