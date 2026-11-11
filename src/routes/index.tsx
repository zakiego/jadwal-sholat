import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"
import { DayLine, shortName } from "@/components/day-line"
import { Page, SiteFooter, SiteHeader } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { useNow } from "@/hooks/use-now"
import { pageHead } from "@/lib/seo"
import { getHomePlace } from "@/server/fns"

export const Route = createFileRoute("/")({
  loader: () => getHomePlace(),
  staleTime: 60_000,
  head: () =>
    pageHead({
      title: "Jadwal Sholat Hari Ini untuk Kotamu | Jadwal Sholat",
      description:
        "Waktu sholat hari ini untuk 514 kota dan kabupaten di Indonesia, metode Kemenag RI. Langsung tahu sholat berikutnya, tanpa izin lokasi. Ada API, MCP dan kalender gratis.",
      path: "/",
    }),
  component: Home,
})

function Home() {
  const { place, source, now: serverNow } = Route.useLoaderData()
  const now = useNow(serverNow)
  const city = shortName(place)
  return (
    <Page>
      <SiteHeader cityLabel={city} />
      <main className="flex flex-1 flex-col justify-center gap-8 py-8 sm:py-16">
        <DayLine place={place} now={now} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {source === "ip" ? <span>Kota ditebak dari koneksi internetmu.</span> : <span>Kotamu belum ketahuan, jadi ini Jakarta Pusat.</span>}
          {place.slug && (
            <Button variant="link" className="h-auto px-0 text-foreground" render={<Link to="/$city" params={{ city: place.slug }} />} nativeButton={false}>
              Jadwal sebulan di {city}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          )}
        </div>
      </main>
      <SiteFooter slug={place.slug} />
    </Page>
  )
}
