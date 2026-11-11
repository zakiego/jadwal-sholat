import { SITE_NAME, SITE_URL } from "@/lib/site"

type HeadInput = { title: string; description: string; path: string; image?: string; imageAlt?: string; noindex?: boolean }

/** One title, description, canonical, robots and matching OG/Twitter tags per page. */
export function pageHead({ title, description, path, image = "/og/default.png", imageAlt, noindex }: HeadInput) {
  const url = `${SITE_URL}${path}`
  const img = image.startsWith("http") ? image : `${SITE_URL}${image}`
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: noindex ? "noindex, follow" : "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "id_ID" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: img },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: imageAlt ?? title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
    ],
    links: [{ rel: "canonical", href: url }],
  }
}
