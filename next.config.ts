import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Cache aggressively for static assets, but not for API routes
  output: 'standalone',
  poweredByHeader: false,
  // Use compression
  compress: true,
  
  // Add custom headers to prevent caching for API responses and main pages
  async headers() {
    return [
      // Static asset rules first (more specific paths)
      {
        // Static assets in _next/static - cached for 1 month in CDN, 2 hours in browser
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=7200, s-maxage=2592000, stale-while-revalidate=31536000'
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=2592000'
          }
        ]
      },
      {
        // Images - cached for 1 month in CDN, 2 hours in browser
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=7200, s-maxage=2592000, stale-while-revalidate=31536000'
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=2592000'
          }
        ]
      },
      {
        // Public assets like fonts, icons, etc.
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=7200, s-maxage=2592000, stale-while-revalidate=31536000'
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=2592000'
          }
        ]
      },
      // No-cache rules after (less specific paths)
      {
        // Apply these headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      },
      {
        // Apply no-cache headers to main website pages (dynamic content)
        // This must come LAST as it's the most general rule
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
