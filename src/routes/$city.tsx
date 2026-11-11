import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { DayLine, shortName } from "@/components/day-line"
import { MonthTable } from "@/components/month-table"
import { Page, SiteFooter, SiteHeader } from "@/components/site-shell"
import { useNow } from "@/hooks/use-now"
import { dateIn } from "@/lib/prayer/schedule"
import { pageHead } from "@/lib/seo"
import { getCityPage } from "@/server/fns"

export const Route = createFileRoute("/$city")({
  loader: async ({ params }) => {
    const data = await getCityPage({ data: { city: params.city } })
    if (!data) throw notFound()
    return data
  },
  staleTime: 60_000,
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { city } = loaderData
    const short = shortName(loaderData.place)
    return pageHead({
      title: `Jadwal Sholat ${short} Hari Ini | Jadwal Sholat`,
      description: `Waktu Imsak, Subuh, Dzuhur, Ashar, Maghrib dan Isya di ${city.name}, ${city.province} hari ini dan sebulan penuh. Metode Kemenag RI, ada hitung mundur ke sholat berikutnya.`,
      path: `/${city.slug}`,
      image: `/og/${city.slug}.png`,
      imageAlt: `Jadwal sholat ${city.name}`,
    })
  },
  component: CityPage,
})

function CityPage() {
  const { place, city, others, now: serverNow } = Route.useLoaderData()
  const now = useNow(serverNow)
  const short = shortName(place)
  return (
    <Page>
      <SiteHeader cityLabel={short} />
      <main className="flex flex-col gap-16 py-8 sm:gap-20 sm:py-16">
        <DayLine place={place} now={now} />
        <MonthTable place={place} today={dateIn(now, place.timezone)} cityLabel={short} />
        <section className="flex flex-col gap-3 text-sm text-muted-foreground" aria-labelledby="method-heading">
          <h2 id="method-heading" className="text-base font-semibold text-foreground">
            Cara menghitungnya
          </h2>
          <p className="max-w-2xl">
            Metode Kemenag RI: Subuh saat matahari 20° di bawah ufuk, Isya 18°, Ashar saat bayangan sama panjang dengan bendanya, plus ihtiyat 2 menit. Titiknya{" "}
            {place.lat.toFixed(4)}, {place.lng.toFixed(4)} di ketinggian {place.elevation} m. Hasilnya sama dengan jadwal resmi Kemenag, atau beda paling banyak 1 menit.
          </p>
        </section>
        {others.length > 0 && (
          <nav className="flex flex-col gap-3" aria-labelledby="others-heading">
            <h2 id="others-heading" className="text-base font-semibold">
              Kota lain di {city.province}
            </h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3 lg:grid-cols-4">
              {others.map((o) => (
                <li key={o.slug} className="min-w-0">
                  <Link to="/$city" params={{ city: o.slug }} className="block truncate rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                    {o.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>
      <SiteFooter slug={city.slug} />
    </Page>
  )
}
