import { PRAYER_KEYS } from "@/lib/prayer/engine"
import { currentPrayer, dateIn, daySchedule, LABELS_ID, nextPrayer, zoneAbbr, type Options, type Place } from "@/lib/prayer/schedule"
import { SITE_HOST } from "@/lib/site"

const CLI_AGENTS = /^(curl|wget|httpie|xh|powershell|fetch|libfetch|aria2)/i

export function wantsText(req: Request) {
  const accept = req.headers.get("accept") ?? ""
  return CLI_AGENTS.test(req.headers.get("user-agent") ?? "") && !accept.includes("text/html")
}

const bold = (s: string, color: boolean) => (color ? `\x1b[1m${s}\x1b[0m` : s)
const dim = (s: string, color: boolean) => (color ? `\x1b[2m${s}\x1b[0m` : s)
const green = (s: string, color: boolean) => (color ? `\x1b[1;32m${s}\x1b[0m` : s)

function humanDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.ceil((seconds % 3600) / 60)
  return h > 0 ? `${h}j ${m}m` : `${m}m`
}

/** wttr.in-style plain text for `curl sholat.zakiego.com/<city>`. */
export function scheduleText(place: Place, now: number, opts: Options, color: boolean) {
  const date = dateIn(now, place.timezone)
  const day = daySchedule(place, date, opts)
  const next = nextPrayer(place, now, opts)
  const cur = currentPrayer(place, now, opts)
  const zone = zoneAbbr(place.timezone) ?? place.timezone
  const out = [
    "",
    `  ${bold(`Jadwal Sholat ${place.name}`, color)}${place.province ? dim(`, ${place.province}`, color) : ""}`,
    `  ${dim(`${day.weekday}, ${day.date} · ${day.hijri.text} · ${zone}`, color)}`,
    "",
  ]
  for (const k of PRAYER_KEYS) {
    const line = `  ${LABELS_ID[k].padEnd(9)}${day.times[k] ?? "--:--"}`
    out.push(next && next.key === k && next.date === date ? green(`${line}  ← berikutnya`, color) : k === cur ? bold(`${line}  · sekarang`, color) : line)
  }
  out.push("")
  if (next) out.push(`  ${next.name} dalam ${humanDuration(next.in_seconds)}`)
  const slug = place.slug ?? `?lat=${place.lat}&lng=${place.lng}`
  out.push(dim(`  JSON: curl ${SITE_HOST}/api/v1/schedule/${slug.startsWith("?") ? slug : slug}`, color).replace("/schedule/?", "/schedule?"))
  out.push("")
  return out.join("\n")
}

export function textResponse(body: string, status = 200) {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } })
}
