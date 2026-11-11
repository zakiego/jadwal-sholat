import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
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
    <div className={cn("relative min-w-0 rounded-lg border bg-muted/50", className)}>
      {label && <div className="border-b px-4 py-2 text-xs text-muted-foreground">{label}</div>}
      <pre className="overflow-x-auto p-4 pr-12 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button variant="ghost" size="icon-sm" className={cn("absolute right-2", label ? "top-10" : "top-2")} onClick={copy} aria-label={copied ? "Copied" : "Copy code"}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  )
}
