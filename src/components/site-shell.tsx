import { Link, useNavigate } from "@tanstack/react-router"
import { CitySearch } from "@/components/city-search"
import { CopyCommand } from "@/components/copy-command"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SITE_HOST } from "@/lib/site"
import { cn } from "@/lib/utils"

export function SiteHeader({ cityLabel }: { cityLabel?: string }) {
  const navigate = useNavigate()
  return (
    <header className="flex items-center justify-between gap-3">
      <Link to="/" className="shrink-0 rounded-sm text-sm font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        jadwal sholat
      </Link>
      <div className="flex min-w-0 items-center gap-1">
        <Button variant="ghost" size="lg" className="hidden sm:inline-flex" render={<Link to="/docs" />} nativeButton={false}>
          API & MCP
        </Button>
        <CitySearch
          label={cityLabel ?? "Pilih kota"}
          onSelect={(slug) => navigate({ to: "/$city", params: { city: slug } })}
          className="max-w-[58vw] sm:max-w-xs"
        />
      </div>
    </header>
  )
}

export function SiteFooter({ slug }: { slug?: string | null }) {
  return (
    <footer className="flex flex-col gap-5">
      <Separator />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CopyCommand command={`curl ${SITE_HOST}${slug ? `/${slug}` : ""}`} className="sm:max-w-sm" />
        <nav className="-mx-2.5 flex flex-wrap gap-1" aria-label="Untuk developer">
          <Button variant="ghost" size="sm" render={<a href={slug ? `/api/v1/schedule/${slug}` : "/api/v1"} />} nativeButton={false}>
            JSON API
          </Button>
          <Button variant="ghost" size="sm" render={<Link to="/docs" hash="mcp" />} nativeButton={false}>
            MCP
          </Button>
          {slug && (
            <Button variant="ghost" size="sm" render={<a href={`/api/v1/calendar/${slug}.ics`} />} nativeButton={false}>
              Kalender (.ics)
            </Button>
          )}
          <Button variant="ghost" size="sm" render={<Link to="/docs" />} nativeButton={false}>
            Docs
          </Button>
        </nav>
      </div>
      <p className="text-xs text-muted-foreground">
        Dihitung dengan metode Kemenag RI. Gratis, tanpa iklan, tanpa izin lokasi.
      </p>
    </footer>
  )
}

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-10 px-4 py-5 sm:px-8 sm:py-8", className)}>{children}</div>
}
