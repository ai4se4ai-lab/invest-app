// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Enable server actions if needed
    serverActions: {
      bodySizeLimit: '10mb', // Increase body size limit for PDF uploads
    },
  },
  
  // Webpack configuration for handling PDF parsing
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle pdf-parse module properly on server side
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'canvas',
        'pdf2pic': 'pdf2pic'
      });
    }
    
    return config;
  },

  // Handle file uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },

  // Image optimization settings
  images: {
    domains: [],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;