/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // Tokens/secrets must never be exposed to the client bundle.
  // Only variables explicitly read on the server (no NEXT_PUBLIC_ prefix) are used for
  // SMTP / Meta / LinkedIn / Cloudinary credentials throughout this app.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
