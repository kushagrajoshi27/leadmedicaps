import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint is run separately in CI; FlatCompat has a circular-JSON bug in
    // the Next.js build worker with this version of eslint-config-next.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Keep firebase-admin (Node.js SDK) out of the webpack bundle —
  // it must run only on the Node.js server runtime, never in the Edge.
  serverExternalPackages: ["firebase-admin"],
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;
