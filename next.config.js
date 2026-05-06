/** @type {import('next').NextConfig} */
const isCapacitorBuild = process.env.CAPACITOR_BUILD === '1'

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  // Use relative assets only for Capacitor static bundling.
  // On Vercel/web this must be absolute to avoid /route/_next 404s.
  assetPrefix: isCapacitorBuild ? './' : undefined,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // pdfjs-dist uses 'canvas' optionally in Node; disable to avoid build errors
    config.resolve.alias.canvas = false
    return config
  },
}

module.exports = nextConfig
