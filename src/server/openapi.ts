import { METHOD_IDS } from "@/lib/prayer/methods"
import { SITE_URL } from "@/lib/site"

const time = { type: ["string", "null"], pattern: "^\\d{2}:\\d{2}$", example: "04:29" }
const ts = { type: ["string", "null"], format: "date-time", example: "2026-11-11T04:29:00+08:00" }
const keys = ["imsak", "fajr", "sunrise", "dhuha", "dhuhr", "asr", "maghrib", "isha"]
const obj = (props: Record<string, unknown>, required = Object.keys(props)) => ({ type: "object", properties: props, required })

const param = (name: string, description: string, schema: Record<string, unknown>, where: "query" | "path" = "query") => ({
  name,
  in: where,
  required: where === "path",
  description,
  schema,
})

const cityPath = param("city", "City slug (`banjarbaru`, `kab-bogor`) or Kemendagri code (`63.72`).", { type: "string", example: "banjarbaru" }, "path")
const method = param("method", "Calculation method.", { type: "string", enum: METHOD_IDS, default: "kemenag" })
const asr = param("asr", "Asr shadow rule.", { type: "string", enum: ["standard", "hanafi"], default: "standard" })
const date = param("date", "Local date. Defaults to today in the location's time zone.", { type: "string", format: "date", example: "2026-11-11" })
const month = param("month", "Return every day of this month instead of one date.", { type: "string", pattern: "^\\d{4}-\\d{2}$", example: "2026-11" })
const format = param("format", "`csv` returns a CSV file. Only with `month`.", { type: "string", enum: ["json", "csv"] })
const coords = [
  param("lat", "Latitude. Use with `lng` for any place in the world.", { type: "number", example: -3.4386 }),
  param("lng", "Longitude.", { type: "number", example: 114.8311 }),
  param("tz", "IANA time zone. Guessed from coordinates when omitted.", { type: "string", example: "Asia/Makassar" }),
  param("elevation", "Meters above sea level.", { type: "number", example: 31 }),
  param("city", "City slug, instead of coordinates.", { type: "string" }),
]

const errorRes = { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
const ok = (ref: string, description = "OK") => ({ description, content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } } })

export const openapi = {
  openapi: "3.1.0",
  info: {
    title: "Jadwal Sholat API",
    version: "1.0.0",
    description:
      "Free prayer times for every Indonesian city and regency (Kemenag RI method), and for any coordinates worldwide. No key, no signup, CORS open. Computed at the edge, so responses are fast and never rate limited by an upstream.",
    license: { name: "MIT" },
  },
  servers: [{ url: SITE_URL }],
  tags: [{ name: "Schedule" }, { name: "Cities" }, { name: "Meta" }],
  paths: {
    "/api/v1/schedule/{city}": {
      get: {
        tags: ["Schedule"],
        operationId: "getCitySchedule",
        summary: "Prayer times for a city, one day or one month",
        parameters: [cityPath, date, month, method, asr, format],
        responses: { "200": ok("DaySchedule", "A day, or a MonthSchedule when `month` is set"), "400": errorRes, "404": errorRes },
      },
    },
    "/api/v1/schedule": {
      get: {
        tags: ["Schedule"],
        operationId: "getSchedule",
        summary: "Prayer times by coordinates, or by the caller's IP when no location is given",
        parameters: [...coords, date, month, method, asr, format],
        responses: { "200": ok("DaySchedule"), "400": errorRes },
      },
    },
    "/api/v1/next/{city}": {
      get: {
        tags: ["Schedule"],
        operationId: "getNextPrayer",
        summary: "The next of the five daily prayers",
        parameters: [cityPath, method, asr],
        responses: { "200": ok("Next"), "404": errorRes },
      },
    },
    "/api/v1/calendar/{city}.ics": {
      get: {
        tags: ["Schedule"],
        operationId: "getCalendar",
        summary: "iCalendar feed to subscribe to in Google Calendar, Apple Calendar or Outlook",
        parameters: [
          cityPath,
          param("days", "How many days ahead.", { type: "integer", default: 60, maximum: 366 }),
          param("alarm", "Minutes before each prayer for a reminder.", { type: "integer", maximum: 120 }),
          param("prayers", "Comma-separated keys to include.", { type: "string", example: "fajr,maghrib" }),
          method,
        ],
        responses: { "200": { description: "text/calendar", content: { "text/calendar": { schema: { type: "string" } } } } },
      },
    },
    "/api/v1/cities": {
      get: {
        tags: ["Cities"],
        operationId: "searchCities",
        summary: "Search the 514 Indonesian kabupaten and kota",
        parameters: [
          param("q", "Name to search.", { type: "string", example: "banjar" }),
          param("province", "Exact province name.", { type: "string", example: "Kalimantan Selatan" }),
          param("limit", "Max results.", { type: "integer", default: 10, maximum: 600 }),
        ],
        responses: { "200": ok("CityList") },
      },
    },
    "/api/v1/cities/{city}": {
      get: { tags: ["Cities"], operationId: "getCity", summary: "One city", parameters: [cityPath], responses: { "200": ok("City"), "404": errorRes } },
    },
    "/api/v1/locate": {
      get: { tags: ["Meta"], operationId: "locate", summary: "Where we think the caller is, from their IP", responses: { "200": { description: "OK" } } },
    },
    "/api/v1/methods": {
      get: { tags: ["Meta"], operationId: "listMethods", summary: "Calculation methods and their angles", responses: { "200": { description: "OK" } } },
    },
  },
  components: {
    schemas: {
      Error: obj({ error: obj({ code: { type: "string", example: "city_not_found" }, message: { type: "string" }, docs: { type: "string" } }, ["code", "message"]) }),
      City: obj({
        id: { type: "string", example: "63.72" },
        slug: { type: "string", example: "banjarbaru" },
        name: { type: "string", example: "Kota Banjarbaru" },
        type: { type: "string", enum: ["kota", "kabupaten"] },
        province: { type: "string", example: "Kalimantan Selatan" },
        capital: { type: "string" },
        latitude: { type: "number" },
        longitude: { type: "number" },
        elevation: { type: "number" },
        timezone: { type: "string", example: "Asia/Makassar" },
        population: { type: ["integer", "null"] },
        url: { type: "string" },
      }),
      CityList: obj({ count: { type: "integer" }, total: { type: "integer" }, provinces: { type: "integer" }, cities: { type: "array", items: { $ref: "#/components/schemas/City" } } }),
      Location: obj({
        name: { type: "string" },
        slug: { type: ["string", "null"] },
        province: { type: ["string", "null"] },
        latitude: { type: "number" },
        longitude: { type: "number" },
        elevation: { type: "number" },
        timezone: { type: "string" },
        timezone_abbr: { type: ["string", "null"], example: "WITA" },
      }),
      Times: obj(Object.fromEntries(keys.map((k) => [k, time]))),
      Timestamps: obj(Object.fromEntries(keys.map((k) => [k, ts]))),
      Hijri: obj({ date: { type: "string", example: "1448-05-20" }, day: { type: "integer" }, month: { type: "integer" }, month_name: { type: "string" }, year: { type: "integer" }, text: { type: "string", example: "20 Jumadil Awal 1448 H" } }),
      NextPrayer: obj({
        key: { type: "string", enum: ["fajr", "dhuhr", "asr", "maghrib", "isha"] },
        name: { type: "string", example: "Ashar" },
        date: { type: "string" },
        time: { type: "string" },
        timestamp: { type: "string" },
        epoch: { type: "integer" },
        in_seconds: { type: "integer" },
      }),
      Next: obj({ location: { $ref: "#/components/schemas/Location" }, now: { type: "string" }, next: { $ref: "#/components/schemas/NextPrayer" } }),
      DaySchedule: obj({
        location: { $ref: "#/components/schemas/Location" },
        method: { type: "object" },
        date: { type: "string", format: "date" },
        weekday: { type: "string", example: "Rabu" },
        hijri: { $ref: "#/components/schemas/Hijri" },
        utc_offset: { type: "string", example: "+08:00" },
        times: { $ref: "#/components/schemas/Times" },
        timestamps: { $ref: "#/components/schemas/Timestamps" },
        next: { oneOf: [{ $ref: "#/components/schemas/NextPrayer" }, { type: "null" }] },
      }),
    },
  },
}

export const llmsTxt = `# Jadwal Sholat

> Islamic prayer times for every Indonesian city and regency (514 kabupaten/kota, Kemenag RI method) and for any coordinates worldwide. Free JSON API, MCP server, iCal feeds and a curl-friendly text view. No API key.

Times match the official Kemenag schedule to within a minute. Default method is \`kemenag\` (Fajr 20°, Isha 18°, 2 minutes ihtiyat). Keys are English: imsak, fajr (Subuh), sunrise (Terbit), dhuha, dhuhr (Dzuhur), asr (Ashar), maghrib, isha (Isya). Times are local to the place, HH:mm, 24-hour.

## API

- [Today for a city](${SITE_URL}/api/v1/schedule/banjarbaru): GET /api/v1/schedule/{city}?date=YYYY-MM-DD
- [A whole month](${SITE_URL}/api/v1/schedule/banjarbaru?month=2026-11): add \`&format=csv\` for CSV
- [By coordinates](${SITE_URL}/api/v1/schedule?lat=-6.2&lng=106.8): any place in the world, time zone is guessed
- [Next prayer](${SITE_URL}/api/v1/next/banjarbaru)
- [Search cities](${SITE_URL}/api/v1/cities?q=bandung): returns slugs like \`bandung\` (kota) and \`kab-bandung\` (kabupaten)
- [iCal feed](${SITE_URL}/api/v1/calendar/banjarbaru.ics?alarm=10)
- [OpenAPI 3.1 spec](${SITE_URL}/openapi.json)

## MCP

- Streamable HTTP endpoint: ${SITE_URL}/mcp (stateless, no auth)
- Tools: search_cities, get_prayer_times, get_next_prayer, get_monthly_schedule, list_methods
- Claude Code: \`claude mcp add --transport http jadwal-sholat ${SITE_URL}/mcp\`

## Terminal

- \`curl ${SITE_URL.replace("https://", "")}\` shows today for your IP location
- \`curl ${SITE_URL.replace("https://", "")}/banjarbaru\` shows today for a city

## Docs

- [Developer docs](${SITE_URL}/docs)
`
