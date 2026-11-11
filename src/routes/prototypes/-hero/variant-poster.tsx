import { CitySearch } from "@/components/city-search"
import { CopyCommand } from "@/components/copy-command"
import { Separator } from "@/components/ui/separator"
import { PRAYER_KEYS } from "@/lib/prayer/engine"
import { LABELS_ID, zoneAbbr } from "@/lib/prayer/schedule"
import { clock, longDate } from "@/lib/format"
import { SITE_HOST } from "@/lib/site"
import { cn } from "@/lib/utils"
import { useToday, type VariantProps } from "./use-today"

/** Axis: type scale. One word fills the screen, everything else whispers. */
export function Poster({ place, now, onCity }: VariantProps) {
  const { day, next, secondsLeft } = useToday(place, now)
  const city = place.name.replace(/^(Kota|Kabupaten) /, "")
  const zone = zoneAbbr(place.timezone) ?? place.timezone
  const nextIsToday = next?.date === day.date

  return (
    <div className="min-h-svh bg-secondary">
      <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col items-center px-4 py-5 text-center sm:px-8 sm:py-8">
        <CitySearch label={city} onSelect={onCity} className="max-w-[80vw] bg-background" />

        <section className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
          <p className="text-sm text-muted-foreground">{next ? (nextIsToday ? "Sholat berikutnya" : "Besok pagi") : "Hari ini"}</p>
          <h1 className="font-serif text-[clamp(5rem,22vw,11rem)] leading-none tracking-tight pb-1">{next?.name ?? "—"}</h1>
          <p className="text-4xl font-medium tabular-nums sm:text-5xl" aria-live="off">
            {clock(secondsLeft)}
          </p>
          <p className="text-base text-muted-foreground">
            jam <span className="tabular-nums text-foreground">{next?.time}</span> {zone} di {city}
          </p>
        </section>

        <div className="flex w-full flex-col items-center gap-6">
          <p className="text-sm text-muted-foreground">
            {day.weekday}, {longDate(day.date)} · <span className="font-serif text-base italic">{day.hijri.text}</span>
          </p>
          <Separator className="max-w-xl" />
          <dl className="grid w-full max-w-2xl grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-8">
            {PRAYER_KEYS.map((k) => {
              const at = day.epochs[k]
              const passed = at !== null && at <= now
              const isNext = nextIsToday && next?.key === k
              return (
                <div key={k} className="flex flex-col items-center gap-1">
                  <dt className={cn("text-xs", isNext ? "font-medium text-highlight" : "text-muted-foreground")}>{LABELS_ID[k]}</dt>
                  <dd className={cn("text-base tabular-nums", passed && !isNext && "text-muted-foreground line-through decoration-1", isNext && "font-semibold text-highlight")}>
                    {day.times[k] ?? "--:--"}
                  </dd>
                </div>
              )
            })}
          </dl>
          <CopyCommand command={`curl ${SITE_HOST}/${place.slug ?? ""}`} className="max-w-xs bg-background" />
        </div>
      </div>
    </div>
  )
}
