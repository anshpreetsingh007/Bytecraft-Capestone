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
      { source: '/api/chat', destination: isDev ? 'http://127.0.0.1:3001/api/chat' : 'http://ai-chatbot-service:3001/api/chat' },
      { source: '/api/chat/:path*', destination: isDev ? 'http://127.0.0.1:3001/api/chat/:path*' : 'http://ai-chatbot-service:3001/api/chat/:path*' },
      
      { source: '/api/estimates', destination: isDev ? 'http://127.0.0.1:3002/api/estimates' : 'http://estimate-service:3002/api/estimates' },
      { source: '/api/estimates/:path*', destination: isDev ? 'http://127.0.0.1:3002/api/estimates/:path*' : 'http://estimate-service:3002/api/estimates/:path*' },
      
      { source: '/api/inventory', destination: isDev ? 'http://127.0.0.1:3003/api/inventory' : 'http://inventory-service:3003/api/inventory' },
      { source: '/api/inventory/:path*', destination: isDev ? 'http://127.0.0.1:3003/api/inventory/:path*' : 'http://inventory-service:3003/api/inventory/:path*' },
      
      { source: '/api/auth', destination: isDev ? 'http://127.0.0.1:3004/api/auth' : 'http://auth-service:3004/api/auth' },
      { source: '/api/auth/:path*', destination: isDev ? 'http://127.0.0.1:3004/api/auth/:path*' : 'http://auth-service:3004/api/auth/:path*' },
      
      { source: '/api/notifications', destination: isDev ? 'http://127.0.0.1:3005/api/notifications' : 'http://notification-service:3005/api/notifications' },
      { source: '/api/notifications/:path*', destination: isDev ? 'http://127.0.0.1:3005/api/notifications/:path*' : 'http://notification-service:3005/api/notifications/:path*' },
      
      { source: '/api/reports', destination: isDev ? 'http://127.0.0.1:3006/api/reports' : 'http://report-service:3006/api/reports' },
      { source: '/api/reports/:path*', destination: isDev ? 'http://127.0.0.1:3006/api/reports/:path*' : 'http://report-service:3006/api/reports/:path*' },
      
      { source: '/api/job-reports', destination: isDev ? 'http://127.0.0.1:3006/api/job-reports' : 'http://report-service:3006/api/job-reports' },
      { source: '/api/job-reports/:path*', destination: isDev ? 'http://127.0.0.1:3006/api/job-reports/:path*' : 'http://report-service:3006/api/job-reports/:path*' },
      
      { source: '/api/inspection-requests', destination: isDev ? 'http://127.0.0.1:3007/api/inspection-requests' : 'http://submission-service:3007/api/inspection-requests' },
      { source: '/api/inspection-requests/:path*', destination: isDev ? 'http://127.0.0.1:3007/api/inspection-requests/:path*' : 'http://submission-service:3007/api/inspection-requests/:path*' },
      
      { source: '/api/orders', destination: isDev ? 'http://127.0.0.1:3007/api/orders' : 'http://submission-service:3007/api/orders' },
      { source: '/api/orders/:path*', destination: isDev ? 'http://127.0.0.1:3007/api/orders/:path*' : 'http://submission-service:3007/api/orders/:path*' },
      
      { source: '/api/inspectors', destination: isDev ? 'http://127.0.0.1:3007/api/inspectors' : 'http://submission-service:3007/api/inspectors' },
      { source: '/api/inspectors/:path*', destination: isDev ? 'http://127.0.0.1:3007/api/inspectors/:path*' : 'http://submission-service:3007/api/inspectors/:path*' },
    ];
  }
};

export default nextConfig;
