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
    // turbotrace removed as it's no longer supported in Next.js 15
  },
  compiler: {
    // Disable React server components features we don't use for smaller builds
    removeConsole: process.env.NODE_ENV === 'production',
    // SWC minify moved here from root config
    minify: true,
  },
  // Only build the pages we actually need
  typescript: {
    // Speed up build by not doing type checking during build
    // (we do it separately)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Speed up build by not doing linting during build
    // (we do it separately)
    ignoreDuringBuilds: true,
  },
  // Cache aggressively
  output: 'standalone',
  poweredByHeader: false,
  // Use compression
  compress: true,
};

module.exports = nextConfig; 