/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/validator/verify/:id1/validate/:id2',
        destination: '/validator/verify/:id2',
        permanent: false,
      },
      {
        source: '/validate/:id',
        destination: '/validator/verify/:id',
        permanent: false,
      }
    ];
  },
};

export default nextConfig;
