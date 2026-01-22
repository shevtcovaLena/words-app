import type { NextConfig } from 'next'

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
})

const nextConfig: NextConfig = {
  // Убрали cacheComponents, так как он несовместим с dynamic = 'force-dynamic'
  // Добавляем пустой turbopack конфиг для совместимости с next-pwa (webpack)
  turbopack: {},
}

module.exports = withPWA(nextConfig)
