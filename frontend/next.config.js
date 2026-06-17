/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Enable gzip/brotli compression
  compress: true,

  // ✅ Remove X-Powered-By header (minor security + perf)
  poweredByHeader: false,

  // ✅ Use SWC minifier (faster & smaller than Terser)
  swcMinify: true,

  // ✅ Restore scroll position on back/forward navigation
  experimental: {
    scrollRestoration: true,

    // ✅ Inline critical CSS, reduce render-blocking
    optimizeCss: true,

    // ✅ Tree-shake large icon/chart libs — only bundle what's imported
    optimizePackageImports: [
      "lucide-react",
      "chart.js",
    ],
  },

  // ✅ Optimize images (AVIF + WebP)
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
    ],
  },
};

module.exports = nextConfig;
