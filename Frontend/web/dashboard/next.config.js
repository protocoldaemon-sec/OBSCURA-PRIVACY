/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['obscura.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'jup.ag',
      },
      {
        protocol: 'https',
        hostname: 'cdn.1inch.io',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide polyfills for Node.js modules in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
        fs: false,
        path: false,
      };
    }

    // Enable WebAssembly support for WOTS+ library
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://obscura-api.daemonprotocol.com/:path*',
      },
    ]
  },
}

module.exports = nextConfig
