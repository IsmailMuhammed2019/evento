/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizeCss: false,
  },
  // Disable font optimization to prevent preload warnings
  optimizeFonts: false,
}

module.exports = nextConfig
