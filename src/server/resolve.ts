import tzlookup from "tz-lookup"
import { getCity, nearestCity, DEFAULT_CITY } from "@/lib/cities"
import { parseDate, type AsrSchool } from "@/lib/prayer/engine"
import { isMethodId, METHOD_IDS } from "@/lib/prayer/methods"
import { placeFromCity, type Options, type Place } from "@/lib/prayer/schedule"

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

export type GeoHint = { lat?: number; lng?: number; timezone?: string; city?: string; country?: string }

/** Cloudflare attaches the caller's approximate location to every request. */
export function geoFromRequest(req: Request): GeoHint {
  const cf = (req as Request & { cf?: Record<string, unknown> }).cf
  if (!cf) return {}
  const num = (v: unknown) => (v === undefined || v === null || v === "" ? undefined : Number(v))
  return {
    lat: num(cf.latitude),
    lng: num(cf.longitude),
    timezone: typeof cf.timezone === "string" ? cf.timezone : undefined,
    city: typeof cf.city === "string" ? cf.city : undefined,
    country: typeof cf.country === "string" ? cf.country : undefined,
  }
}

export function validTimezone(tz: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function placeFromCoords(lat: number, lng: number, opts: { timezone?: string; elevation?: number; name?: string } = {}): Place {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new ApiError(400, "invalid_latitude", "lat must be a number between -90 and 90")
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new ApiError(400, "invalid_longitude", "lng must be a number between -180 and 180")
  const timezone = opts.timezone ?? tzlookup(lat, lng)
  if (!validTimezone(timezone)) throw new ApiError(400, "invalid_timezone", `Unknown IANA time zone: ${timezone}`)
  const near = nearestCity(lat, lng)
  return {
    name: opts.name ?? (near.distanceKm <= 25 ? `Near ${near.city.name}` : `${lat.toFixed(4)}, ${lng.toFixed(4)}`),
    slug: null,
    province: near.distanceKm <= 25 ? near.city.province : null,
    lat,
    lng,
    elevation: Math.max(0, opts.elevation ?? 0),
    timezone,
  }
}

export function placeFromCitySlug(slug: string): Place {
  const city = getCity(slug)
  if (!city) throw new ApiError(404, "city_not_found", `No city with slug or id "${slug}". Try GET /api/v1/cities?q=${encodeURIComponent(slug)}`)
  return placeFromCity(city)
}

/** Indonesia gets the nearest bundled city; anywhere else gets exact coordinates. */
export function placeFromGeo(geo: GeoHint): { place: Place; source: "ip" | "default" } {
  if (geo.lat !== undefined && geo.lng !== undefined && Number.isFinite(geo.lat) && Number.isFinite(geo.lng)) {
    if (geo.country === "ID") return { place: placeFromCity(nearestCity(geo.lat, geo.lng).city), source: "ip" }
    return {
      place: placeFromCoords(geo.lat, geo.lng, { timezone: geo.timezone && validTimezone(geo.timezone) ? geo.timezone : undefined, name: geo.city }),
      source: "ip",
    }
  }
  return { place: placeFromCity(DEFAULT_CITY), source: "default" }
}

export function parseOptions(params: URLSearchParams): Options {
  const method = params.get("method")?.toLowerCase()
  const asr = params.get("asr")?.toLowerCase()
  if (method && !isMethodId(method)) throw new ApiError(400, "invalid_method", `method must be one of: ${METHOD_IDS.join(", ")}`)
  if (asr && asr !== "standard" && asr !== "hanafi") throw new ApiError(400, "invalid_asr", "asr must be standard or hanafi")
  return { method: (method as Options["method"]) ?? "kemenag", asr: (asr as AsrSchool) ?? "standard" }
}

export function checkDate(date: string) {
  if (!parseDate(date)) throw new ApiError(400, "invalid_date", "date must be YYYY-MM-DD")
  return date
}

export function checkMonth(month: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(month)
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) throw new ApiError(400, "invalid_month", "month must be YYYY-MM")
  return month
}

/** Resolves `?city=` or `?lat=&lng=` (plus optional `tz` and `elevation`), falling back to the caller's IP. */
export function placeFromParams(params: URLSearchParams, req: Request) {
  const city = params.get("city")
  if (city) return placeFromCitySlug(city)
  const lat = params.get("lat") ?? params.get("latitude")
  const lng = params.get("lng") ?? params.get("lon") ?? params.get("longitude")
  if (lat !== null || lng !== null) {
    if (lat === null || lng === null) throw new ApiError(400, "missing_coordinates", "Pass both lat and lng")
    const elevation = params.get("elevation")
    return placeFromCoords(Number(lat), Number(lng), {
      timezone: params.get("tz") ?? params.get("timezone") ?? undefined,
      elevation: elevation ? Number(elevation) : undefined,
    })
  }
  return placeFromGeo(geoFromRequest(req)).place
}
