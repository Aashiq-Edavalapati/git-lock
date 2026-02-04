/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://git-lock.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;