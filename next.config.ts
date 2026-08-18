import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The browser only ever talks to this app; it proxies to the services. That
  // is what lets docker-compose stop publishing ports 3001-3007 to the host.
  poweredByHeader: false,
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
      // Inspector-authored job reports. The `report` table already existed and
      // the analytics read from it, but nothing ever wrote a row.
      { source: '/api/job-reports/:path*', destination: isDev ? 'http://localhost:3006/api/job-reports/:path*' : 'http://report-service:3006/api/job-reports/:path*' },
      { source: '/api/inspection-requests/:path*', destination: isDev ? 'http://localhost:3007/api/inspection-requests/:path*' : 'http://submission-service:3007/api/inspection-requests/:path*' },
      { source: '/api/orders/:path*', destination: isDev ? 'http://localhost:3007/api/orders/:path*' : 'http://submission-service:3007/api/orders/:path*' },
      { source: '/api/inspectors/:path*', destination: isDev ? 'http://localhost:3007/api/inspectors/:path*' : 'http://submission-service:3007/api/inspectors/:path*' },
    ];
  }
};

export default nextConfig;