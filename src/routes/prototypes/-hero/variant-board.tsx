import { ArrowRightIcon, CheckIcon, CircleDashedIcon } from "lucide-react"
import { CitySearch } from "@/components/city-search"
import { CopyCommand } from "@/components/copy-command"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PRAYER_KEYS } from "@/lib/prayer/engine"
import { LABELS_ID, zoneAbbr } from "@/lib/prayer/schedule"
import { clock, longDate } from "@/lib/format"
import { SITE_HOST } from "@/lib/site"
import { cn } from "@/lib/utils"
import { useToday, type VariantProps } from "./use-today"

/** Axis: density. A dark departure board, every time at equal weight, status on each tile. */
export function Board({ place, now, onCity }: VariantProps) {
  const { day, next, secondsLeft } = useToday(place, now)
  const city = place.name.replace(/^(Kota|Kabupaten) /, "")
  const zone = zoneAbbr(place.timezone) ?? place.timezone
  const nextIsToday = next?.date === day.date

  return (
    <div className="dark min-h-svh bg-background font-mono text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-5 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-xl font-semibold tracking-tight uppercase sm:text-2xl">Jadwal sholat {city}</h1>
            <p className="text-xs text-muted-foreground">
              {day.weekday}, {longDate(day.date)} · {day.hijri.text} · {zone}
            </p>
          </div>
          <CitySearch label={city} onSelect={onCity} className="font-sans" />
        </header>

        {next && (
          <p className="flex items-center gap-2 text-sm">
            <ArrowRightIcon className="size-4 text-highlight" aria-hidden="true" />
            <span>
              {next.name} {nextIsToday ? "" : "besok "}jam {next.time}, <span className="text-highlight tabular-nums">{clock(secondsLeft)}</span> lagi
            </span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PRAYER_KEYS.map((k) => {
            const at = day.epochs[k]
            const passed = at !== null && at <= now
            const isNext = nextIsToday && next?.key === k
            return (
              <Card key={k} size="sm" className={cn(isNext && "ring-2 ring-highlight", passed && "opacity-60")}>
                <CardHeader>
                  <CardTitle className="text-xs font-normal tracking-widest text-muted-foreground uppercase">{LABELS_ID[k]}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <span className="text-3xl font-medium tabular-nums sm:text-4xl">{day.times[k] ?? "--:--"}</span>
                  <span className={cn("flex items-center gap-1.5 text-xs", isNext ? "text-highlight" : "text-muted-foreground")}>
                    {isNext ? (
                      <>
                        <ArrowRightIcon className="size-3.5" aria-hidden="true" /> berikutnya
                      </>
                    ) : passed ? (
                      <>
                        <CheckIcon className="size-3.5" aria-hidden="true" /> lewat
                      </>
                    ) : (
                      <>
                        <CircleDashedIcon className="size-3.5" aria-hidden="true" /> nanti
                      </>
                    )}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CopyCommand command={`curl ${SITE_HOST}/${place.slug ?? ""}`} className="sm:max-w-sm" />
          <nav className="flex flex-wrap gap-1 font-sans">
            <Button variant="ghost" size="sm" render={<a href={`/api/v1/schedule/${place.slug}`} />} nativeButton={false}>
              GET /api/v1
            </Button>
            <Button variant="ghost" size="sm" render={<a href="/docs#mcp" />} nativeButton={false}>
              MCP
            </Button>
            <Button variant="ghost" size="sm" render={<a href={`/api/v1/calendar/${place.slug}.ics`} />} nativeButton={false}>
              .ics
            </Button>
          </nav>
        </div>
      </div>
    </div>
  )
}
