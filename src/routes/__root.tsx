import { HeadContent, Link, Scripts, createRootRoute } from "@tanstack/react-router"
import { Page, SiteHeader } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#fbfaf8", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#0e0e0e", media: "(prefers-color-scheme: dark)" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
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
            <EmptyTitle>Kota ini belum ada di daftar kami.</EmptyTitle>
            <EmptyDescription>Cari lewat tombol kota di atas, atau buka jadwal untuk lokasimu sekarang.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link to="/" />} nativeButton={false}>
              Jadwal di lokasiku
            </Button>
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
