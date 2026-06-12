import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Facebook page avatars, covers, and post thumbnails.
    remotePatterns: [
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.fbsbx.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
    ],
  },
  async redirects() {
    // Routes from the retired content pipeline.
    return [
      { source: "/trends", destination: "/dashboard", permanent: false },
      { source: "/queue", destination: "/dashboard/posts", permanent: false },
      {
        source: "/settings",
        destination: "/dashboard/settings",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
