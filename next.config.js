/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify has moved to compiler options in Next.js 15
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  compiler: {
    // Disable React server components features we don't use for smaller builds
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Type checking during build
  typescript: {
    // Don't fail the build on type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Don't fail the build on lint errors
    ignoreDuringBuilds: true,
  },
  // Cache aggressively
  output: 'standalone',
  poweredByHeader: false,
  // Use compression
  compress: true,
};

module.exports = nextConfig; 