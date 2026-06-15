/** @type {import('next').NextConfig} */
// CSP e CORS: middleware (nonces + origem por host, ex. www).

const nextConfig = {
  experimental: {
    // Evita cache do Router em navegação client-side (ex.: voltar à Visão geral do admin).
    staleTimes: {
      dynamic: 0,
    },
  },
  transpilePackages: ["react-big-calendar"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "auth.donyapp.com",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lakjtqcqnqblglhlxluj.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/v2", destination: "/", permanent: true },
      { source: "/v3", destination: "/", permanent: true },
      { source: "/v4", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
