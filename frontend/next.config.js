/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA configuration
  images: {
    domains: ['example.com'],
  },
}

module.exports = nextConfig
