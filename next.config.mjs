import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

const withPWAConfig = withPWA({
  dest: 'public',
  customWorkerDir: 'worker',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

export default withPWAConfig(nextConfig)
