/** @type {import('next').NextConfig} */
// The data service is proxied by the route handler at app/api/f1/[...path]/route.ts
// rather than a rewrite, so LH44_API_URL is read per request and the deployment
// can be repointed without a rebuild.
const nextConfig = {
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
};
export default nextConfig;
