import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export for Cloudflare Pages: every page is prerendered at build time.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
