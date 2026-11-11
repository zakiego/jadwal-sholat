import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

/** A read-only shell command with a copy button. The icon flips to a check, no toast. */
export function CopyCommand({ command, className }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Clipboard blocked: the text is still selectable. */
    }
  }
  return (
    <InputGroup className={cn("font-mono", className)}>
      <InputGroupAddon>
        <InputGroupText className="font-mono">$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput readOnly value={command} aria-label="Perintah terminal" className="font-mono text-[13px]" onFocus={(e) => e.currentTarget.select()} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" onClick={copy} aria-label={copied ? "Tersalin" : "Salin perintah"}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
