import { useEffect, useRef, useState } from "react"
import { ChevronDownIcon, MapPinIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type Hit = { slug: string; name: string; province: string }

const POPULAR: Hit[] = [
  { slug: "jakarta-pusat", name: "Kota Jakarta Pusat", province: "DKI Jakarta" },
  { slug: "surabaya", name: "Kota Surabaya", province: "Jawa Timur" },
  { slug: "bandung", name: "Kota Bandung", province: "Jawa Barat" },
  { slug: "medan", name: "Kota Medan", province: "Sumatera Utara" },
  { slug: "makassar", name: "Kota Makassar", province: "Sulawesi Selatan" },
  { slug: "yogyakarta", name: "Kota Yogyakarta", province: "DI Yogyakarta" },
  { slug: "banjarmasin", name: "Kota Banjarmasin", province: "Kalimantan Selatan" },
  { slug: "jayapura", name: "Kota Jayapura", province: "Papua" },
]

export function CitySearch({
  label,
  onSelect,
  className,
}: {
  label: string
  onSelect: (slug: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [state, setState] = useState<"idle" | "loading" | "error">("idle")
  const seq = useRef(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setHits(null)
      setState("idle")
      return
    }
    const id = ++seq.current
    setState("loading")
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/cities?q=${encodeURIComponent(q)}&limit=12`)
        if (!res.ok) throw new Error(String(res.status))
        const body = (await res.json()) as { cities: Hit[] }
        if (id !== seq.current) return
        setHits(body.cities)
        setState("idle")
      } catch {
        if (id === seq.current) setState("error")
      }
    }, 120)
    return () => clearTimeout(t)
  }, [query])

  const list = hits ?? POPULAR
  const pick = (slug: string) => {
    setOpen(false)
    setQuery("")
    onSelect(slug)
  }

  return (
    <>
      <Button variant="outline" size="lg" className={cn("max-w-full min-w-0", className)} onClick={() => setOpen(true)} aria-label={`Ganti kota, sekarang ${label}`}>
        <MapPinIcon data-icon="inline-start" />
        <span className="truncate">{label}</span>
        <ChevronDownIcon data-icon="inline-end" className="opacity-60" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Cari kota" description="Ketik nama kota atau kabupaten">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Cari kota atau kabupaten…" value={query} onValueChange={setQuery} />
          <CommandList>
            {state === "loading" && hits === null ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : state === "error" ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Gagal memuat. Coba ketik lagi.</div>
            ) : (
              <CommandEmpty>Tidak ada kota bernama “{query}”.</CommandEmpty>
            )}
            {list.length > 0 && state !== "error" && (
              <CommandGroup heading={hits ? "Hasil" : "Kota besar"}>
                {list.map((c) => (
                  <CommandItem key={c.slug} value={c.slug} onSelect={() => pick(c.slug)}>
                    <MapPinIcon />
                    <span className="min-w-0 truncate">{c.name}</span>
                    <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">{c.province}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
        <div className="hidden items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground sm:flex">
          <Kbd>↵</Kbd> pilih <Kbd>esc</Kbd> tutup
        </div>
      </CommandDialog>
    </>
  )
}
