/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admin.24eywa.ru',
        pathname: '/static/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/static/**',
      },
    ],
    unoptimized: false,
  },
}

module.exports = nextConfig
