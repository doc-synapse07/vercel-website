/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: ["/admin*", "/api/*", "/checkout*", "/cart", "/account", "/order/success*"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin/", "/api/", "/checkout/", "/cart", "/account"] },
    ],
  },
  sitemapSize: 5000,
  changefreq: "weekly",
  priority: 0.7,
  transform: async (config, path) => {
    // Exclude admin and API routes
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return null;
    }
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  // NOTE: product/category pages are discovered automatically from the
  // Next.js build manifest. The previous implementation imported TS source
  // (./src/lib/queries) from this JS config, which breaks at build time.
};