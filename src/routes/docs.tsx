import { createFileRoute } from "@tanstack/react-router"
import { CodeBlock } from "@/components/code-block"
import { Page, SiteFooter, SiteHeader } from "@/components/site-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { METHODS } from "@/lib/prayer/methods"
import { pageHead } from "@/lib/seo"
import { SITE_HOST, SITE_URL } from "@/lib/site"

export const Route = createFileRoute("/docs")({
  head: () => {
    const h = pageHead({
      title: "Prayer Times API and MCP Server for Indonesia | Jadwal Sholat",
      description:
        "Free JSON API, MCP server, iCal feeds and a curl view for Islamic prayer times in all 514 Indonesian cities (Kemenag RI method) and any coordinates worldwide. No key needed.",
      path: "/docs",
      image: "/og/docs.png",
    })
    return { ...h, meta: [...h.meta.filter((m) => !("property" in m && m.property === "og:locale")), { property: "og:locale", content: "en_US" }] }
  },
  component: Docs,
})

const ENDPOINTS: [string, string][] = [
  ["/api/v1/schedule/{city}", "Today for a city. Add ?date=YYYY-MM-DD for another day, or ?month=YYYY-MM for a month."],
  ["/api/v1/schedule?lat=&lng=", "Any coordinates. Time zone is guessed, or pass tz and elevation."],
  ["/api/v1/schedule", "No location at all: uses the caller's IP."],
  ["/api/v1/next/{city}", "The next of the five daily prayers, with seconds remaining."],
  ["/api/v1/cities?q=", "Search the 514 kabupaten and kota. Returns slugs."],
  ["/api/v1/cities/{city}", "One city with its coordinates, elevation and time zone."],
  ["/api/v1/calendar/{city}.ics", "Calendar feed. ?alarm=10 adds reminders, ?prayers=fajr,maghrib filters."],
  ["/api/v1/locate", "Where we think the caller is."],
  ["/api/v1/methods", "Calculation methods and their angles."],
]

const SAMPLE = `{
  "location": { "name": "Kota Banjarbaru", "slug": "banjarbaru", "timezone": "Asia/Makassar", "timezone_abbr": "WITA", ... },
  "method": { "id": "kemenag", "fajr_angle": 20, "isha_angle": 18, "ihtiyat_minutes": 2, "asr": "standard" },
  "date": "2026-11-11",
  "weekday": "Rabu",
  "hijri": { "date": "1448-06-01", "text": "1 Jumadil Akhir 1448 H", ... },
  "times": {
    "imsak": "04:28", "fajr": "04:38", "sunrise": "05:54", "dhuha": "06:22",
    "dhuhr": "12:08", "asr": "15:29", "maghrib": "18:16", "isha": "19:28"
  },
  "timestamps": { "fajr": "2026-11-11T04:38:00+08:00", ... },
  "next": { "key": "isha", "name": "Isya", "time": "19:28", "in_seconds": 3480, ... }
}`

const MCP_JSON = `{
  "mcpServers": {
    "jadwal-sholat": {
      "type": "http",
      "url": "${SITE_URL}/mcp"
    }
  }
}`

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-4" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="text-2xl font-semibold tracking-[-0.015em]">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Docs() {
  return (
    <Page>
      <SiteHeader />
      <main lang="en" className="flex flex-col gap-16 py-8 sm:py-16">
        <div className="flex max-w-3xl flex-col gap-4">
          <h1 className="text-[2.5rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance sm:text-6xl">Prayer times for your app, agent or terminal.</h1>
          <p className="text-lg text-muted-foreground">
            Every Indonesian city and regency on the Kemenag RI method, plus any coordinates in the world. No key, no signup, CORS open.
          </p>
        </div>

        <Section id="quickstart" title="Quick start">
          <CodeBlock code={`curl ${SITE_HOST}/banjarbaru`} label="Terminal: today, as text" />
          <CodeBlock code={`curl ${SITE_URL}/api/v1/schedule/banjarbaru`} label="JSON" />
          <CodeBlock code={`const res = await fetch("${SITE_URL}/api/v1/next/surabaya")\nconst { next } = await res.json()\nconsole.log(\`\${next.name} at \${next.time}\`)`} label="JavaScript" />
        </Section>

        <Section id="endpoints" title="Endpoints">
          <p className="max-w-2xl text-muted-foreground">
            All GET, all JSON unless noted. {"{city}"} is a slug like <code className="font-mono text-foreground">banjarbaru</code> or{" "}
            <code className="font-mono text-foreground">kab-bogor</code>, or a Kemendagri code like <code className="font-mono text-foreground">63.72</code>. Every schedule endpoint takes{" "}
            <code className="font-mono text-foreground">method</code> and <code className="font-mono text-foreground">asr</code>.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead>What it returns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ENDPOINTS.map(([path, what]) => (
                <TableRow key={path}>
                  <TableCell className="font-mono text-[13px] whitespace-normal break-all">{path}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{what}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground">
            Full spec:{" "}
            <a className="text-foreground underline underline-offset-4" href="/openapi.json">
              /openapi.json
            </a>{" "}
            (OpenAPI 3.1). Month schedules also come as CSV with <code className="font-mono text-foreground">&format=csv</code>.
          </p>
        </Section>

        <Section id="response" title="Response">
          <p className="max-w-2xl text-muted-foreground">
            Keys are English. Times are local to the place in 24-hour HH:mm, and <code className="font-mono text-foreground">timestamps</code> carries the same instants as ISO 8601 with
            the offset. A time is <code className="font-mono text-foreground">null</code> when the sun never reaches that angle, which only happens far from the equator.
          </p>
          <CodeBlock code={SAMPLE} label="GET /api/v1/schedule/banjarbaru" />
          <p className="max-w-2xl text-sm text-muted-foreground">
            Errors come back as <code className="font-mono text-foreground">{`{ "error": { "code", "message" } }`}</code> with a 400 or 404 status.
          </p>
        </Section>

        <Section id="mcp" title="MCP server">
          <p className="max-w-2xl text-muted-foreground">
            Streamable HTTP at <code className="font-mono text-foreground">{SITE_URL}/mcp</code>. Stateless, no auth. Tools: search_cities, get_prayer_times, get_next_prayer,
            get_monthly_schedule and list_methods.
          </p>
          <CodeBlock code={`claude mcp add --transport http jadwal-sholat ${SITE_URL}/mcp`} label="Claude Code" />
          <CodeBlock code={MCP_JSON} label="Cursor (.cursor/mcp.json) and other clients that take a JSON config" />
          <CodeBlock code={`npx -y mcp-remote ${SITE_URL}/mcp`} label="Clients that only speak stdio" />
        </Section>

        <Section id="calendar" title="Calendar">
          <p className="max-w-2xl text-muted-foreground">
            Subscribe to a city in Google Calendar, Apple Calendar or Outlook. It refreshes daily and covers the next 60 days by default.
          </p>
          <CodeBlock code={`${SITE_URL}/api/v1/calendar/banjarbaru.ics?alarm=10`} label="Subscription URL" />
        </Section>

        <Section id="methods" title="Methods and accuracy">
          <p className="max-w-2xl text-muted-foreground">
            Times are computed at the edge from the sun's position, so there's no upstream to rate limit you. The default <code className="font-mono text-foreground">kemenag</code>{" "}
            method matched the official Kemenag schedule to the minute in 105 of 120 checks across five cities and three dates, and was 1 minute off in the other 15. City
            coordinates and elevations come from the Kemendagri regional dataset by cahyadsn (MIT).
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>method</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Fajr</TableHead>
                <TableHead className="text-right">Isha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(METHODS).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-[13px]">{m.id}</TableCell>
                  <TableCell className="whitespace-normal">{m.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.fajr}°</TableCell>
                  <TableCell className="text-right tabular-nums">{m.ishaMinutes ? `${m.ishaMinutes} min` : `${m.isha}°`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      </main>
      <SiteFooter />
    </Page>
  )
}
