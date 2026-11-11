// Compare our Kemenag times with the official ones served by api.myquran.com.
import cities from "../src/data/cities.json"
import { computePrayerEpochs } from "../src/lib/prayer/engine"

const picks = (process.argv[3] ?? "banjarbaru,surabaya,medan,makassar,jayapura").split(",")
const dates = (process.argv[2] ?? "2026-11-11,2027-03-20,2027-06-21").split(",")
const keys = { imsak: "imsak", subuh: "fajr", terbit: "sunrise", dhuha: "dhuha", dzuhur: "dhuhr", ashar: "asr", maghrib: "maghrib", isya: "isha" } as const
const hist: Record<string, Record<number, number>> = {}
for (const slug of picks) {
  const c = (cities as any[]).find((x) => x.slug === slug)
  const q = c.type === "kota" ? `kota ${c.short}` : `kab ${c.short}`
  await new Promise((r) => setTimeout(r, 1500))
  const s = await (await fetch(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(c.short)}`)).json()
  const hit = s.data?.find((x: any) => x.lokasi.toLowerCase().replace("kab. ", "kab ") === q.toLowerCase()) ?? s.data?.[0]
  for (const date of dates) {
    const [y, m, d] = date.split("-")
    await new Promise((r) => setTimeout(r, 1500))
    const j = (await (await fetch(`https://api.myquran.com/v2/sholat/jadwal/${hit.id}/${y}/${m}/${d}`)).json()).data.jadwal
    const ours = computePrayerEpochs({ date, lat: c.lat, lng: c.lng, elevation: c.elevation, timezone: c.tz })
    const fmt = (ms: number) => new Intl.DateTimeFormat("en-GB", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ms)
    const row: string[] = []
    for (const [k, ok] of Object.entries(keys)) {
      const mine = fmt(ours[ok]!)
      const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3))
      const diff = toMin(mine) - toMin(j[k])
      ;(hist[k] ??= {})[diff] = ((hist[k] ??= {})[diff] ?? 0) + 1
      row.push(`${k}:${diff >= 0 ? "+" : ""}${diff}`)
    }
    console.log(slug.padEnd(14), date, hit.lokasi.padEnd(22), row.join(" "))
  }
}
console.log(JSON.stringify(hist))
