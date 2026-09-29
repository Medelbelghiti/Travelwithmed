import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // NOTE: every entry is an exact path or ends in "/" on purpose.
        // robots.txt Disallow is a PREFIX match, so the previous bare "/trip"
        // also blocked "/trip-planner" - a real, sitemap-listed, indexable
        // marketing page. Keep these specific. The admin dashboard is already
        // covered by "/admin/"; there is no user-facing /trips route.
        disallow: ["/admin/", "/api/", "/out/", "/search", "/printables/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}