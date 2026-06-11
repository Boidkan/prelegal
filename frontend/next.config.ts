import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static export (`out/`) that FastAPI serves at the root.
  // See node_modules/next/dist/docs/01-app/02-guides/static-exports.md.
  output: "export",
  // Emit `route/index.html` instead of `route.html` so a plain static file
  // server (FastAPI's StaticFiles, html=True) resolves `/signin/` directly.
  trailingSlash: true,
  // No Next.js image optimization server exists in a static export.
  images: { unoptimized: true },
};

export default nextConfig;
