import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',').filter(Boolean) ?? ['localhost', '127.0.0.1'],
}

export default nextConfig
