import { useState } from "react"
import { CopySwapIcon } from "@/components/copy-icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** A code sample with a copy button. The icon flips to a check, no toast. */
export function CodeBlock({ code, label, className }: { code: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Clipboard blocked: the text is still selectable. */
    }
  }
  return (
    <div className={cn("min-w-0 rounded-lg border bg-muted/50", className)}>
      <div className="flex items-center justify-between gap-3 border-b py-1 pr-1 pl-4 text-xs text-muted-foreground">
        <span>{label}</span>
        <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={copy} data-copied={copied ? "" : undefined} aria-label={copied ? "Copied" : "Copy code"}>
          <CopySwapIcon />
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
