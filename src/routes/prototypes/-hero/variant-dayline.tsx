import { CitySearch } from "@/components/city-search"
import { CopyCommand } from "@/components/copy-command"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PRAYER_KEYS, type PrayerKey } from "@/lib/prayer/engine"
import { LABELS_ID, zoneAbbr } from "@/lib/prayer/schedule"
import { hoursInZone, longDate, untilText } from "@/lib/format"
import { SITE_HOST } from "@/lib/site"
import { cn } from "@/lib/utils"
import { useToday, type VariantProps } from "./use-today"

const ON_LINE: PrayerKey[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]

/** Axis: time as space. The day is one line and you are a dot on it. */
export function DayLine({ place, now, onCity }: VariantProps) {
  const { day, next, current } = useToday(place, now)
  const tz = place.timezone
  const city = place.name.replace(/^(Kota|Kabupaten) /, "")
  const zone = zoneAbbr(tz) ?? tz
  const hours = Object.fromEntries(PRAYER_KEYS.map((k) => [k, day.epochs[k] === null ? null : hoursInZone(day.epochs[k]!, tz)])) as Record<PrayerKey, number | null>
  const start = (hours.imsak ?? 4) - 0.5
  const end = (hours.isha ?? 20) + 1
  const pos = (h: number) => Math.min(1, Math.max(0, (h - start) / (end - start)))
  const nowPos = pos(hoursInZone(now, tz))
  const nextIsToday = next?.date === day.date

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-4 py-5 sm:px-8 sm:py-8">
      <header className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-sm font-semibold tracking-tight">jadwal sholat</span>
        <CitySearch label={city} onSelect={onCity} className="max-w-[60vw]" />
      </header>

      <section className="flex flex-1 flex-col justify-center gap-10 py-12 sm:gap-14">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {day.weekday}, {longDate(day.date)} · {day.hijri.text} · {zone}
          </p>
          {next ? (
            <h1 className="max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl">
              {next.name} di {city} jam <span className="tabular-nums">{next.time}</span>,{" "}
              <span className="text-highlight">{untilText(next.in_seconds)} lagi.</span>
            </h1>
          ) : (
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Jadwal sholat {city} hari ini.</h1>
          )}
        </div>

        {/* Desktop: the day as a horizontal line. */}
        <div className="relative hidden h-28 lg:block" aria-hidden="true">
          <div className="absolute inset-x-0 top-8 h-px bg-border" />
          <div className="absolute top-8 left-0 h-px bg-foreground" style={{ width: `${nowPos * 100}%` }} />
          {ON_LINE.map((k) => {
            const h = hours[k]
            if (h === null) return null
            const isNext = nextIsToday && next?.key === k
            const above = k === "sunrise"
            return (
              <div key={k} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${pos(h) * 100}%` }}>
                <span className={cn("h-7 text-xs text-muted-foreground", !above && "invisible")}>{LABELS_ID[k]}</span>
                <span className={cn("mt-0.5 size-2 rounded-full border border-foreground bg-background", isNext && "border-highlight bg-highlight")} />
                {!above && (
                  <span className={cn("mt-3 text-sm font-medium", isNext ? "text-highlight" : h < hoursInZone(now, tz) ? "text-muted-foreground" : "")}>
                    {LABELS_ID[k]}
                  </span>
                )}
                <span className={cn("text-sm tabular-nums", above ? "mt-3 text-muted-foreground" : "text-muted-foreground")}>{day.times[k]}</span>
              </div>
            )
          })}
          <div className="absolute top-8 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${nowPos * 100}%` }}>
            <span className="size-3.5 rounded-full bg-highlight ring-4 ring-background" />
          </div>
        </div>

        {/* Phone and tablet: the same line, standing up. */}
        <ol className="flex flex-col lg:hidden">
          {PRAYER_KEYS.map((k) => {
            const at = day.epochs[k]
            const passed = at !== null && at <= now
            const isNext = nextIsToday && next?.key === k
            return (
              <li key={k} className="relative flex items-center gap-4 py-2.5 pl-6">
                <span className={cn("absolute top-0 bottom-0 left-[5px] w-px", passed ? "bg-foreground" : "bg-border")} />
                <span
                  className={cn(
                    "absolute left-0 size-[11px] rounded-full border",
                    isNext ? "border-highlight bg-highlight" : passed ? "border-foreground bg-foreground" : "border-border bg-background",
                  )}
                />
                <span className={cn("w-20 text-base", isNext ? "font-semibold text-highlight" : passed && "text-muted-foreground")}>{LABELS_ID[k]}</span>
                <span className={cn("text-base tabular-nums", isNext ? "font-semibold text-highlight" : passed && "text-muted-foreground")}>{day.times[k] ?? "--:--"}</span>
                {k === current && !isNext && <span className="text-xs text-muted-foreground">sekarang</span>}
              </li>
            )
          })}
        </ol>

        <dl className="hidden grid-cols-8 gap-4 lg:grid">
          {PRAYER_KEYS.map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{LABELS_ID[k]}</dt>
              <dd className={cn("text-lg tabular-nums", nextIsToday && next?.key === k && "font-semibold text-highlight")}>{day.times[k] ?? "--:--"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Separator />
      <footer className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <CopyCommand command={`curl ${SITE_HOST}/${place.slug ?? ""}`} className="sm:max-w-sm" />
        <nav className="flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" render={<a href={`/api/v1/schedule/${place.slug}`} />} nativeButton={false}>
            JSON API
          </Button>
          <Button variant="ghost" size="sm" render={<a href="/docs#mcp" />} nativeButton={false}>
            MCP
          </Button>
          <Button variant="ghost" size="sm" render={<a href={`/api/v1/calendar/${place.slug}.ics`} />} nativeButton={false}>
            Kalender
          </Button>
        </nav>
      </footer>
    </div>
  )
}
