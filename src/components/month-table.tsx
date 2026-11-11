import { useMemo } from "react"
import { CalendarPlusIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PRAYER_KEYS } from "@/lib/prayer/engine"
import { LABELS_ID, monthSchedule, type Place } from "@/lib/prayer/schedule"
import { cn } from "@/lib/utils"

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

export function MonthTable({ place, today, cityLabel }: { place: Place; today: string; cityLabel: string }) {
  const month = today.slice(0, 7)
  const days = useMemo(() => monthSchedule(place, month), [place, month])
  const monthName = `${MONTHS[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`
  return (
    <section className="flex flex-col gap-4" aria-labelledby="month-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="month-heading" className="text-2xl font-semibold tracking-[-0.015em]">
          Jadwal sholat {cityLabel} {monthName}
        </h2>
        <div className="-mx-2.5 flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" render={<a href={`/api/v1/schedule/${place.slug}?month=${month}&format=csv`} download />} nativeButton={false}>
            <DownloadIcon data-icon="inline-start" />
            CSV
          </Button>
          <Button variant="ghost" size="sm" render={<a href={`/api/v1/calendar/${place.slug}.ics?alarm=10`} />} nativeButton={false}>
            <CalendarPlusIcon data-icon="inline-start" />
            Tambah ke kalender
          </Button>
        </div>
      </div>
      <Table className="tabular-nums">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">Tanggal</TableHead>
            {PRAYER_KEYS.map((k) => (
              <TableHead key={k} className="text-right">
                {LABELS_ID[k]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {days.map((d) => {
            const isToday = d.date === today
            return (
              <TableRow key={d.date} aria-current={isToday ? "date" : undefined} className={cn(isToday && "bg-muted font-medium")}>
                <TableCell className={cn("sticky left-0", isToday ? "bg-muted" : "bg-background")}>
                  <span className="inline-block w-7">{Number(d.date.slice(8))}</span>
                  <span className="text-muted-foreground">{d.weekday.slice(0, 3)}</span>
                </TableCell>
                {PRAYER_KEYS.map((k) => (
                  <TableCell key={k} className="text-right">
                    {d.times[k] ?? "--:--"}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </section>
  )
}
