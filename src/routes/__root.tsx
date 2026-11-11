import { HeadContent, Link, Scripts, createRootRoute } from "@tanstack/react-router"
import { Page, SiteHeader } from "@/components/site-shell"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { title: "Halaman tidak ditemukan | Jadwal Sholat" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#fbfaf8" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400..800&family=JetBrains+Mono:wght@400;500&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <Page>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              <h1>Kota ini belum ada di daftar kami</h1>
            </EmptyTitle>
            <EmptyDescription>Cari lewat tombol kota di atas, atau buka jadwal untuk lokasimu sekarang.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/" className={buttonVariants()}>
              Buka jadwal di lokasimu
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    </Page>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
