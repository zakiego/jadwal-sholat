import { createServerEntry, createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server"
import { getCity } from "@/lib/cities"
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

  if (path === "/mcp" || path === "/mcp/") return handleMcp(req)
  const api = handleApi(req, url)
  if (api) return api
  if (path === "/openapi.json") {
    return new Response(JSON.stringify(openapi, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600", ...CORS_HEADERS },
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
