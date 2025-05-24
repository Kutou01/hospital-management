import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move serverComponentsExternalPackages to the correct location
  serverExternalPackages: ['@supabase/ssr'],
  webpack: (config, { isServer }) => {
    // Handle Node.js modules for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    return config;
  },
  // Only transpile @supabase/supabase-js for client-side usage
  transpilePackages: ['@supabase/supabase-js'],
  // Disable source maps in development to reduce bundle size
  productionBrowserSourceMaps: false,
};

export default nextConfig;
