import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    return [
      { source: '/api/chat/:path*', destination: isDev ? 'http://localhost:3001/api/chat/:path*' : 'http://ai-chatbot-service:3001/api/chat/:path*' },
      { source: '/api/estimates/:path*', destination: isDev ? 'http://localhost:3002/api/estimates/:path*' : 'http://estimate-service:3002/api/estimates/:path*' },
      { source: '/api/inventory/:path*', destination: isDev ? 'http://localhost:3003/api/inventory/:path*' : 'http://inventory-service:3003/api/inventory/:path*' },
      { source: '/api/auth/:path*', destination: isDev ? 'http://localhost:3004/api/auth/:path*' : 'http://auth-service:3004/api/auth/:path*' },
      { source: '/api/notifications/:path*', destination: isDev ? 'http://localhost:3005/api/notifications/:path*' : 'http://notification-service:3005/api/notifications/:path*' },
      { source: '/api/reports/:path*', destination: isDev ? 'http://localhost:3006/api/reports/:path*' : 'http://report-service:3006/api/reports/:path*' },
      { source: '/api/inspection-requests/:path*', destination: isDev ? 'http://localhost:3007/api/inspection-requests/:path*' : 'http://submission-service:3007/api/inspection-requests/:path*' },
    ];
  }
};

export default nextConfig;