import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // El navegador llama a /api/* (mismo origen) y Next reenvía al backend.
    // Así la cookie de sesión httpOnly es first-party y se evita el
    // problema cross-origin. API_URL se hornea en build time (ver Dockerfile).
    const api = process.env.API_URL ?? "http://localhost:3001";
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};

export default nextConfig;
