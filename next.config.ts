import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Behind a shared password and not meant to be found — keep it out of
  // search results.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
