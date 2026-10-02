import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Product PDFs are often 50–200 MB, so the default 1 MB server-action body
  // limit has to be raised for the admin upload form to work.
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },

  // Covers are uploaded at arbitrary sizes; allow the Next image optimiser
  // to fetch them from our own media route as well as remote hosts.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media-cdn.cosmofeed.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.cloudflarestorage.com" },
    ],
  },
};

export default nextConfig;