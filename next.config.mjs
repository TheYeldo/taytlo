/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "shikimori.one" },
      { protocol: "https", hostname: "anilibria.top" },
      { protocol: "https", hostname: "anilibria.wtf" },
      { protocol: "https", hostname: "static-libria.weekstorm.one" }
    ]
  }
};

export default nextConfig;
