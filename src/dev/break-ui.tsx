// Dev-only worst-case data for the city page. The route only reads it behind import.meta.env.DEV.
import { daySchedule, dateIn, type Place } from "@/lib/prayer/schedule"

export const DATASETS = ["demo", "worst", "after-isha", "polar"] as const
export type Dataset = (typeof DATASETS)[number]

/** Swaps the data at the same boundary the loader fills: the place and the clock. */
export function applyDataset(ds: Dataset, place: Place, now: number): { place: Place; now: number } {
  if (ds === "worst") {
    // Longest real regency name in Kemendagri's list, unabbreviated, in the longest province name.
    return {
      place: { ...place, name: "Kabupaten Kepulauan Siau Tagulandang Biaro", province: "Kepulauan Bangka Belitung", slug: "kab-kep-siau-tagulandang-biaro" },
      now,
    }
  }
  if (ds === "after-isha") {
    const isha = daySchedule(place, dateIn(now, place.timezone)).epochs.isha ?? now
    return { place, now: isha + 30 * 60_000 }
  }
  if (ds === "polar") {
    // Tromsø at midsummer: the sun never sets, so twilight angles are never reached.
    return {
      place: { name: "Tromsø", slug: null, province: null, lat: 69.6492, lng: 18.9553, elevation: 0, timezone: "Europe/Oslo" },
      now: Date.UTC(2026, 5, 21, 10, 0),
    }
  }
  return { place, now }
}

const LABEL: Record<Dataset, string> = { demo: "Demo data", worst: "Worst case", "after-isha": "After Isya", polar: "No sunset" }

export function DatasetToggle({ value, onChange }: { value: Dataset; onChange: (d: Dataset) => void }) {
  return (
    <div
      role="group"
      aria-label="Dev data set"
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2147483647,
        display: "flex",
        gap: 2,
        padding: 3,
        borderRadius: 999,
        background: "#e5e5e5",
        font: "12px -apple-system, system-ui, sans-serif",
      }}
    >
      {DATASETS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          style={{ border: 0, borderRadius: 999, padding: "6px 10px", cursor: "pointer", background: d === value ? "#fff" : "transparent", color: "#111", whiteSpace: "nowrap" }}
        >
          {LABEL[d]}
        </button>
      ))}
    </div>
  )
}
