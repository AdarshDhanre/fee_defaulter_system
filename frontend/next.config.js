/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Enable gzip/brotli compression
  compress: true,

  // ✅ Remove X-Powered-By header (minor security + perf)
  poweredByHeader: false,

  // ✅ Optimize images
  images: {
    domains: ["cdn-icons-png.flaticon.com"],
    formats: ["image/avif", "image/webp"],
  },

  // ✅ Experimental optimizations
  experimental: {
    optimizeCss: true,           // Inline critical CSS, reduce render-blocking
    optimizePackageImports: [    // Tree-shake large icon libs
      "lucide-react",
      "chart.js",
    ],
  },
};

module.exports = nextConfig;
