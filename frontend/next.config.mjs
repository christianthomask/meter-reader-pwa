import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow S3 images for meter photos
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
    ],
  },
  // API proxy for local development
  async rewrites() {
    return process.env.NEXT_PUBLIC_API_URL
      ? []
      : [
          {
            source: "/api/:path*",
            destination: "http://localhost:3001/api/:path*",
          },
        ];
  },
};

export default pwaConfig(nextConfig);
