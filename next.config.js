/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Use SWC for minification (faster than Terser)
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  experimental: {
    // Enable memory optimizations
    optimizeCss: true,
    // Reduce memory usage and build time
    turbotrace: {
      memoryLimit: process.env.NEXT_WEBPACK_MEMORY_LIMIT 
        ? parseInt(process.env.NEXT_WEBPACK_MEMORY_LIMIT) 
        : 4096,
    },
  },
  compiler: {
    // Disable React server components features we don't use for smaller builds
    removeConsole: process.env.NODE_ENV === 'production',
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