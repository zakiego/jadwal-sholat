import { createServerEntry, createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server"
import { CITIES, getCity } from "@/lib/cities"
import { SITE_HOST, SITE_URL } from "@/lib/site"
import { placeFromCity } from "@/lib/prayer/schedule"
import { CORS_HEADERS, errorResponse, handleApi } from "@/server/api"
import { handleMcp } from "@/server/mcp"
import { llmsTxt, openapi } from "@/server/openapi"
import { geoFromRequest, parseOptions, placeFromGeo, placeFromParams } from "@/server/resolve"
import { scheduleText, textResponse, wantsText } from "@/server/text"

const start = createStartHandler(defaultStreamHandler)

async function route(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname

  // Cloudflare's "Always Use HTTPS" is off for this host so plain `curl sholat.zakiego.com/<city>`
  // (which defaults to http) reaches the text view. Everything else still gets upgraded here.
  if (url.protocol === "http:" && url.hostname === SITE_HOST && !(req.method === "GET" && wantsText(req))) {
    url.protocol = "https:"
    return Response.redirect(url.toString(), 301)
  }

  if (path === "/mcp" || path === "/mcp/") return handleMcp(req)
  const api = handleApi(req, url)
  if (api) return api
  if (path === "/openapi.json") {
    return new Response(JSON.stringify(openapi, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600", ...CORS_HEADERS },
    })
  }
  if (path === "/robots.txt") {
    return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /mcp\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" },
    })
  }
  if (path === "/sitemap.xml") {
    const urls = ["/", "/docs", ...CITIES.map((c) => `/${c.slug}`)].map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join("\n")
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=86400" },
    })
  }
  if (path === "/llms.txt") return new Response(llmsTxt, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } })

  // `curl sholat.zakiego.com/banjarbaru` gets plain text instead of HTML.
  if (req.method === "GET" && wantsText(req)) {
    const color = url.searchParams.get("color") !== "0" && !url.searchParams.has("plain")
    try {
      const opts = parseOptions(url.searchParams)
      const slug = decodeURIComponent(path.slice(1).replace(/\/$/, ""))
      if (!slug) {
        const place = url.searchParams.has("lat") || url.searchParams.has("city") ? placeFromParams(url.searchParams, req) : placeFromGeo(geoFromRequest(req)).place
        return textResponse(scheduleText(place, Date.now(), opts, color))
      }
      const city = getCity(slug)
      if (city) return textResponse(scheduleText(placeFromCity(city), Date.now(), opts, color))
    } catch (err) {
      return errorResponse(err)
    }
  }

  return start(req)
}

export default createServerEntry({ fetch: route })
