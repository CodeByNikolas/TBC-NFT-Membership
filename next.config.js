/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify has moved to compiler options in Next.js 15
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  experimental: {
    // Enable memory optimizations
    optimizeCss: true,
  },
  compiler: {
    // Disable React server components features we don't use for smaller builds
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Type checking during build
  typescript: {
    // Enable type checking during build
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable linting during build
    ignoreDuringBuilds: false,
  },
  // Cache aggressively
  output: 'standalone',
  poweredByHeader: false,
  // Use compression
  compress: true,
};

module.exports = nextConfig; 