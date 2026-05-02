/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip static generation for error pages
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp',
        },
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
      ],
    },
  ],
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Ignore onnxruntime-node native bindings (client-side only app)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Ignore .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader',
    });

    return config;
  },
};

export default nextConfig;

// Made with Bob
