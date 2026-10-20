import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Review used to live at /review.
    return [{ source: "/review", destination: "/app/review", permanent: false }];
  },
};

export default nextConfig;
