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
    additionalSitemaps: [`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/sitemap-products.xml`],
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
  additionalPaths: async () => {
    // Add product pages dynamically
    const paths = [];
    try {
      const { getProducts } = await import("./src/lib/queries");
      const { products } = await getProducts({ take: 1000 });
      for (const product of products) {
        paths.push({
          loc: `/products/${product.slug}`,
          changefreq: "weekly",
          priority: 0.8,
          lastmod: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Could not fetch products for sitemap:", e);
    }
    return paths;
  },
};