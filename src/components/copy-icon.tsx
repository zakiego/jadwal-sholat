import { CheckIcon, CopyIcon } from "lucide-react"

/** Copy and check icons stacked in one cell, crossfaded by `data-copied` on the parent button. */
export function CopySwapIcon() {
  return (
    <span className="copy-swap" aria-hidden="true">
      <CopyIcon className="copy-swap-copy" />
      <CheckIcon className="copy-swap-check" />
    </span>
  )
}
