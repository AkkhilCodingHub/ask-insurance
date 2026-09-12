/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ask/shared'],
  async rewrites() {
    const defaultAdminUrl = 'http://admin.askinsurancebrokers.in';
    const url = (process.env.ADMIN_URL || defaultAdminUrl).trim();
    const adminUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    return [
      {
        source: '/admin',
        destination: `${adminUrl}/`,
      },
      {
        source: '/admin/:path*',
        destination: `${adminUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
