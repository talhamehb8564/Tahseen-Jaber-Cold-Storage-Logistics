import type { NextConfig } from "next";

/**
 * Security headers are applied to every response.
 * The Content-Security-Policy is deliberately permissive about `unsafe-inline`
 * styles only, because Tailwind v4 and the GSAP/Framer Motion runtimes inject
 * inline style attributes. Scripts remain strictly same-origin.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // nodemailer pulls in Node-only modules; keep it out of the client bundle graph.
  serverExternalPackages: ["nodemailer"],

  experimental: {
    // Tree-shake icon/data-grid libraries so only the used exports ship.
    optimizePackageImports: ["lucide-react", "recharts", "motion", "@react-three/drei"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/storage", destination: "/request-storage", permanent: true },
      { source: "/quote", destination: "/request-storage", permanent: true },
    ];
  },
};

export default nextConfig;
