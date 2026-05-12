/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/energy-forecast',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: false,
};

export default nextConfig;
