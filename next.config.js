/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Disable image optimization for external URLs to avoid 500 errors
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'localhost',
      'via.placeholder.com',
      // Add your image domains here
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  output: 'standalone',
  trailingSlash: false,
  poweredByHeader: false,

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-hot-toast',
      '@headlessui/react',
      'canvas-confetti',
      'framer-motion'
    ],
  },

  // Webpack optimizations - Removed manual chunking to avoid runtime errors
  webpack: (config) => {
    // SVG optimization
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for performance
  async redirects() {
    return [
      // Add any necessary redirects here
    ];
  },

  // Rewrites for API optimization
  async rewrites() {
    return [
      // Add any necessary rewrites here
    ];
  },

  // Compression
  compress: true,

  // Generate ETags for better caching
  generateEtags: true,

  // Environment variables for performance monitoring
  env: {
    NEXT_PUBLIC_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'production' ? 'true' : 'false',
  },
};

module.exports = nextConfig;
