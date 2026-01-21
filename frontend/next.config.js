const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  // Internationalization
  i18n: {
    locales: ['id', 'en'],
    defaultLocale: 'id',
    localeDetection: true,
  },
};

module.exports = withPWA(nextConfig);
