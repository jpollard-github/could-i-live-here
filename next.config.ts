import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Everything renders from the checked-in extract; no runtime map-data API.
};

export default nextConfig;
