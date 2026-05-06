/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  assetPrefix: './',
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
