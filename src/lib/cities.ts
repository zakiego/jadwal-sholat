import data from "@/data/cities.json"

export type City = {
  /** Kemendagri region code, like `63.72`. */
  id: string
  slug: string
  name: string
  short: string
  type: "kota" | "kabupaten"
  province: string
  capital: string
  lat: number
  lng: number
  elevation: number
  tz: string
  population: number | null
}

export const CITIES = data as City[]
const BY_SLUG = new Map(CITIES.map((c) => [c.slug, c]))
const BY_ID = new Map(CITIES.map((c) => [c.id, c]))

export const PROVINCES = [...new Set(CITIES.map((c) => c.province))].sort()

export function getCity(slugOrId: string) {
  const key = slugOrId.toLowerCase()
  return BY_SLUG.get(key) ?? BY_ID.get(key) ?? null
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(kota|kabupaten|kab|administrasi)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const INDEX = CITIES.map((c) => ({ c, short: norm(c.short), full: norm(`${c.short} ${c.capital} ${c.province}`) }))

/** Ranks prefix matches on the short name first, then substring matches, then by population. */
export function searchCities(query: string, { limit = 10, province }: { limit?: number; province?: string } = {}) {
  const q = norm(query)
  const wantsKab = /\bkab/.test(query.toLowerCase())
  const wantsKota = /\bkota\b/.test(query.toLowerCase())
  const pool = province ? INDEX.filter((x) => x.c.province.toLowerCase() === province.toLowerCase()) : INDEX
  if (!q) return pool.slice(0, limit).map((x) => x.c)
  const scored: { c: City; s: number }[] = []
  for (const x of pool) {
    let s = 0
    if (x.short === q) s = 100
    else if (x.short.startsWith(q)) s = 80
    else if (x.short.includes(q)) s = 60
    else if (x.full.includes(q)) s = 40
    else continue
    if (wantsKab && x.c.type === "kabupaten") s += 5
    if (wantsKota && x.c.type === "kota") s += 5
    scored.push({ c: x.c, s })
  }
  scored.sort((a, b) => b.s - a.s || (b.c.population ?? 0) - (a.c.population ?? 0))
  return scored.slice(0, limit).map((x) => x.c)
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = Math.PI / 180
  const h =
    Math.sin(((bLat - aLat) * r) / 2) ** 2 +
    Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(((bLng - aLng) * r) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export function nearestCity(lat: number, lng: number) {
  let best = CITIES[0]
  let bestD = Number.POSITIVE_INFINITY
  for (const c of CITIES) {
    const d = distanceKm(lat, lng, c.lat, c.lng)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return { city: best, distanceKm: Math.round(bestD) }
}

export const DEFAULT_CITY = getCity("jakarta-pusat")!
