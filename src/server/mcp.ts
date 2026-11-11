import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker"
import { z } from "zod"
import { searchCities } from "@/lib/cities"
import { METHOD_IDS, METHODS } from "@/lib/prayer/methods"
import { dateIn, methodInfo, monthSchedule, nextPrayer, placeJson, type Options, type Place } from "@/lib/prayer/schedule"
import { SITE_URL } from "@/lib/site"
import { cityJson, CORS_HEADERS, dayJson } from "./api"
import { ApiError, checkDate, checkMonth, geoFromRequest, placeFromCitySlug, placeFromCoords, placeFromGeo } from "./resolve"

const where = {
  city: z
    .string()
    .optional()
    .describe('City slug or Kemendagri code from search_cities, like "banjarbaru", "kab-bogor" or "63.72". Indonesia only.'),
  latitude: z.number().min(-90).max(90).optional().describe("Latitude for any place in the world. Use with longitude instead of city."),
  longitude: z.number().min(-180).max(180).optional().describe("Longitude for any place in the world."),
  timezone: z.string().optional().describe("IANA time zone like Asia/Jakarta. Guessed from the coordinates when omitted."),
  method: z.enum(METHOD_IDS as [string, ...string[]]).optional().describe("Calculation method. Defaults to kemenag (Indonesia)."),
  asr: z.enum(["standard", "hanafi"]).optional().describe("Asr shadow rule. Defaults to standard (Shafi'i, Maliki, Hanbali)."),
}

type Where = { city?: string; latitude?: number; longitude?: number; timezone?: string; method?: string; asr?: string }

function resolve(args: Where, req: Request): { place: Place; opts: Options } {
  const opts = { method: (args.method ?? "kemenag") as Options["method"], asr: (args.asr ?? "standard") as Options["asr"] }
  if (args.city) return { place: placeFromCitySlug(args.city), opts }
  if (args.latitude !== undefined && args.longitude !== undefined) return { place: placeFromCoords(args.latitude, args.longitude, { timezone: args.timezone }), opts }
  return { place: placeFromGeo(geoFromRequest(req)).place, opts }
}

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] })
const fail = (err: unknown) => ({
  isError: true,
  content: [{ type: "text" as const, text: err instanceof ApiError ? `${err.code}: ${err.message}` : "Unexpected error computing prayer times." }],
})

function buildServer(req: Request) {
  const server = new McpServer(
    { name: "jadwal-sholat", title: "Jadwal Sholat", version: "1.0.0", websiteUrl: SITE_URL },
    {
      jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
      instructions:
        "Islamic prayer times. Indonesian cities use the official Kemenag RI method by default. Call search_cities to turn a place name into a city slug, then get_prayer_times or get_next_prayer. For places outside Indonesia pass latitude and longitude. All times are local to the place.",
    },
  )

  server.registerTool(
    "search_cities",
    {
      title: "Search cities",
      description: "Find Indonesian regencies and cities (514 kabupaten/kota) by name. Returns slugs to use in the other tools.",
      inputSchema: { query: z.string().describe('Place name, like "banjarbaru" or "kab bandung"'), limit: z.number().int().min(1).max(50).optional() },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query, limit }) => ok(searchCities(query, { limit: limit ?? 8 }).map(cityJson)),
  )

  server.registerTool(
    "get_prayer_times",
    {
      title: "Get prayer times",
      description:
        "Prayer times for one day: imsak, fajr (Subuh), sunrise (Terbit), dhuha, dhuhr (Dzuhur), asr (Ashar), maghrib and isha (Isya), plus the Hijri date. Defaults to today in the place's time zone. Without city or coordinates it uses the caller's approximate IP location.",
      inputSchema: { ...where, date: z.string().optional().describe("Local date, YYYY-MM-DD. Defaults to today.") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      try {
        const { place, opts } = resolve(args, req)
        const now = Date.now()
        const today = dateIn(now, place.timezone)
        const date = args.date ? checkDate(args.date) : today
        return ok({ location: placeJson(place), method: methodInfo(opts), ...dayJson(place, date, opts), next: date === today ? nextPrayer(place, now, opts) : null })
      } catch (err) {
        return fail(err)
      }
    },
  )

  server.registerTool(
    "get_next_prayer",
    {
      title: "Get next prayer",
      description: "The next of the five daily prayers from now, with its local time and seconds remaining.",
      inputSchema: where,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      try {
        const { place, opts } = resolve(args, req)
        return ok({ location: placeJson(place), now: new Date().toISOString(), next: nextPrayer(place, Date.now(), opts) })
      } catch (err) {
        return fail(err)
      }
    },
  )

  server.registerTool(
    "get_monthly_schedule",
    {
      title: "Get monthly schedule",
      description: "Prayer times for every day of a month. Good for printing a schedule or planning Ramadan.",
      inputSchema: { ...where, month: z.string().describe("YYYY-MM") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      try {
        const { place, opts } = resolve(args, req)
        const month = checkMonth(args.month)
        return ok({
          location: placeJson(place),
          method: methodInfo(opts),
          month,
          days: monthSchedule(place, month, opts).map((d) => ({ date: d.date, weekday: d.weekday, hijri: d.hijri.text, ...d.times })),
        })
      } catch (err) {
        return fail(err)
      }
    },
  )

  server.registerTool(
    "list_methods",
    {
      title: "List calculation methods",
      description: "The supported calculation methods with their Fajr and Isha angles.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => ok(Object.values(METHODS)),
  )

  return server
}

/** Stateless Streamable HTTP: a fresh server per request, JSON responses, no sessions. */
export async function handleMcp(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method === "GET" && (req.headers.get("accept") ?? "").includes("text/html")) {
    return Response.redirect(new URL("/docs#mcp", req.url).toString(), 302)
  }
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  const server = buildServer(req)
  await server.connect(transport)
  const res = await transport.handleRequest(req)
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v)
  return new Response(res.body, { status: res.status, headers })
}
