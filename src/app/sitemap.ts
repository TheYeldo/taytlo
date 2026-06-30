import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    {
      url: `${base}/`,
      lastModified: new Date()
    },
    ...getCatalog().map((anime) => ({
      url: `${base}/anime/${anime.slug}`,
      lastModified: new Date()
    }))
  ];
}
