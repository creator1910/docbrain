import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: 26_214_400, // 25 MB + small buffer
  },
  images: {
    remotePatterns: [
      // Add your Supabase project URL after setup:
      // { protocol: 'https', hostname: '<project-ref>.supabase.co' }
    ],
  },
}

export default nextConfig
