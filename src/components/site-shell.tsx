import { Link, useNavigate } from "@tanstack/react-router"
import { CitySearch } from "@/components/city-search"
import { CopyCommand } from "@/components/copy-command"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SITE_HOST } from "@/lib/site"
import { cn } from "@/lib/utils"

export function SiteHeader({ cityLabel }: { cityLabel?: string }) {
  const navigate = useNavigate()
  return (
    <header className="flex items-center justify-between gap-3">
      <Link to="/" className="shrink-0 rounded-sm text-sm font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring">
        Jadwal Sholat
      </Link>
      <div className="flex min-w-0 items-center gap-1">
        <Link to="/docs" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "hidden sm:inline-flex")}>
          API & MCP
        </Link>
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
          <a href={slug ? `/api/v1/schedule/${slug}` : "/api/v1"} className={buttonVariants({ variant: "ghost" })}>
            JSON API
          </a>
          <Link to="/docs" hash="mcp" className={buttonVariants({ variant: "ghost" })}>
            MCP
          </Link>
          {slug && (
            <a href={`/api/v1/calendar/${slug}.ics`} className={buttonVariants({ variant: "ghost" })}>
              Kalender (.ics)
            </a>
          )}
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
