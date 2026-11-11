import { CITIES, PROVINCES, getCity, searchCities, type City } from "@/lib/cities"
import { PRAYER_KEYS } from "@/lib/prayer/engine"
import { METHODS } from "@/lib/prayer/methods"
import {
  dateIn,
  daySchedule,
  methodInfo,
  monthSchedule,
  nextPrayer,
  placeJson,
  type Options,
  type Place,
} from "@/lib/prayer/schedule"
import { SITE_URL } from "@/lib/site"
import { buildIcs } from "./ical"
import {
  ApiError,
  checkDate,
  checkMonth,
  geoFromRequest,
  parseOptions,
  placeFromCitySlug,
  placeFromGeo,
  placeFromParams,
} from "./resolve"

export const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept, authorization, mcp-session-id, mcp-protocol-version, last-event-id",
  "access-control-expose-headers": "mcp-session-id",
}

type Cache = "static" | "day" | "live"
const CACHE: Record<Cache, string> = {
  static: "public, max-age=86400, s-maxage=604800",
  day: "public, max-age=3600, s-maxage=86400",
  live: "no-store",
}

export function json(body: unknown, status = 200, cache: Cache = "live") {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": CACHE[cache], ...CORS_HEADERS },
  })
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) return json({ error: { code: err.code, message: err.message, docs: `${SITE_URL}/docs` } }, err.status)
  console.error(err)
  return json({ error: { code: "internal_error", message: "Something went wrong on our side." } }, 500)
}

export function cityJson(c: City) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    type: c.type,
    province: c.province,
    capital: c.capital,
    latitude: c.lat,
    longitude: c.lng,
    elevation: c.elevation,
    timezone: c.tz,
    population: c.population,
    url: `${SITE_URL}/${c.slug}`,
  }
}

export function dayJson(place: Place, date: string, opts: Options) {
  const { epochs: _e, ...day } = daySchedule(place, date, opts)
  return day
}

export function scheduleBody(place: Place, params: URLSearchParams, now: number) {
  const opts = parseOptions(params)
  const month = params.get("month")
  const base = { location: placeJson(place), method: methodInfo(opts) }
  if (month) {
    checkMonth(month)
    return { kind: "month" as const, opts, body: { ...base, month, days: monthSchedule(place, month, opts).map(({ epochs: _e, ...d }) => d) } }
  }
  const today = dateIn(now, place.timezone)
  const date = checkDate(params.get("date") ?? today)
  const day = dayJson(place, date, opts)
  return {
    kind: "day" as const,
    opts,
    body: { ...base, ...day, next: date === today ? nextPrayer(place, now, opts) : null },
  }
}

function csv(body: { location: { name: string }; days: ReturnType<typeof dayJson>[] }) {
  const head = ["date", "weekday", "hijri", ...PRAYER_KEYS].join(",")
  const rows = body.days.map((d) => [d.date, d.weekday, d.hijri.date, ...PRAYER_KEYS.map((k) => d.times[k] ?? "")].join(","))
  return [head, ...rows].join("\n") + "\n"
}

function scheduleResponse(place: Place, url: URL, now: number) {
  const r = scheduleBody(place, url.searchParams, now)
  if (r.kind === "month" && url.searchParams.get("format") === "csv") {
    const name = `jadwal-sholat-${place.slug ?? "location"}-${url.searchParams.get("month")}.csv`
    return new Response(csv(r.body), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${name}"`,
        "cache-control": CACHE.day,
        ...CORS_HEADERS,
      },
    })
  }
  const explicitDate = url.searchParams.has("date") || r.kind === "month"
  return json(r.body, 200, explicitDate ? "day" : "live")
}

export function apiIndex() {
  return {
    name: "Jadwal Sholat API",
    version: "1",
    docs: `${SITE_URL}/docs`,
    openapi: `${SITE_URL}/openapi.json`,
    mcp: `${SITE_URL}/mcp`,
    endpoints: {
      schedule_city: `${SITE_URL}/api/v1/schedule/{city}?date=YYYY-MM-DD`,
      schedule_month: `${SITE_URL}/api/v1/schedule/{city}?month=YYYY-MM`,
      schedule_coordinates: `${SITE_URL}/api/v1/schedule?lat=-3.44&lng=114.83`,
      next_prayer: `${SITE_URL}/api/v1/next/{city}`,
      cities: `${SITE_URL}/api/v1/cities?q=banjar`,
      city: `${SITE_URL}/api/v1/cities/{city}`,
      locate: `${SITE_URL}/api/v1/locate`,
      methods: `${SITE_URL}/api/v1/methods`,
      calendar: `${SITE_URL}/api/v1/calendar/{city}.ics`,
    },
  }
}

/** Handles everything under `/api/`. Returns null for paths it doesn't own. */
export function handleApi(req: Request, url: URL, now = Date.now()): Response | null {
  const path = url.pathname.replace(/\/+$/, "") || "/"
  if (!path.startsWith("/api")) return null
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...CORS_HEADERS, "access-control-max-age": "86400" } })
  if (req.method !== "GET" && req.method !== "HEAD") return json({ error: { code: "method_not_allowed", message: "Use GET" } }, 405)
  const p = url.searchParams
  try {
    if (path === "/api" || path === "/api/v1") return json(apiIndex(), 200, "static")

    if (path === "/api/v1/methods") {
      return json(
        {
          default: "kemenag",
          methods: Object.values(METHODS).map((m) => ({
            id: m.id,
            name: m.name,
            region: m.region,
            fajr_angle: m.fajr,
            isha_angle: m.ishaMinutes ? null : m.isha,
            isha_minutes_after_maghrib: m.ishaMinutes ?? null,
            ihtiyat_minutes: m.ihtiyat,
          })),
          asr: ["standard", "hanafi"],
        },
        200,
        "static",
      )
    }

    if (path === "/api/v1/cities") {
      const limit = Math.min(600, Math.max(1, Number(p.get("limit") ?? (p.get("q") ? 10 : 600)) || 10))
      const province = p.get("province") ?? undefined
      const results = searchCities(p.get("q") ?? "", { limit, province })
      return json({ count: results.length, total: CITIES.length, provinces: PROVINCES.length, cities: results.map(cityJson) }, 200, "static")
    }

    let m = /^\/api\/v1\/cities\/([^/]+)$/.exec(path)
    if (m) {
      const city = getCity(decodeURIComponent(m[1]))
      if (!city) throw new ApiError(404, "city_not_found", `No city "${m[1]}". Search with /api/v1/cities?q=...`)
      return json(cityJson(city), 200, "static")
    }

    if (path === "/api/v1/locate") {
      const geo = geoFromRequest(req)
      const { place, source } = placeFromGeo(geo)
      return json({ source, detected: { city: geo.city ?? null, country: geo.country ?? null }, location: placeJson(place) })
    }

    if (path === "/api/v1/schedule" || path === "/api/v1/today") return scheduleResponse(placeFromParams(p, req), url, now)
    m = /^\/api\/v1\/schedule\/([^/]+)$/.exec(path)
    if (m) return scheduleResponse(placeFromCitySlug(decodeURIComponent(m[1])), url, now)

    if (path === "/api/v1/next" || (m = /^\/api\/v1\/next\/([^/]+)$/.exec(path))) {
      const place = m ? placeFromCitySlug(decodeURIComponent(m[1])) : placeFromParams(p, req)
      const opts = parseOptions(p)
      return json({ location: placeJson(place), method: methodInfo(opts), now: new Date(now).toISOString(), next: nextPrayer(place, now, opts) })
    }

    m = /^\/api\/v1\/calendar\/([^/]+?)(\.ics)?$/.exec(path)
    if (m) {
      const place = placeFromCitySlug(decodeURIComponent(m[1]))
      const opts = parseOptions(p)
      const days = Math.min(366, Math.max(1, Number(p.get("days") ?? 60) || 60))
      const alarm = p.get("alarm") ? Math.max(0, Math.min(120, Number(p.get("alarm")))) : null
      const only = p.get("prayers")?.split(",").filter(Boolean)
      const ics = buildIcs(place, dateIn(now, place.timezone), days, opts, { alarm, only })
      return new Response(ics, {
        headers: {
          "content-type": "text/calendar; charset=utf-8",
          "content-disposition": `inline; filename="jadwal-sholat-${place.slug}.ics"`,
          "cache-control": CACHE.day,
          ...CORS_HEADERS,
        },
      })
    }

    throw new ApiError(404, "not_found", `No endpoint at ${path}. See ${SITE_URL}/api/v1`)
  } catch (err) {
    return errorResponse(err)
  }
}
