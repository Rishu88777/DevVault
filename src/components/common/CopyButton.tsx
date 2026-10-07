import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch { return false }
  }
}

export function useCopy() {
  const [copied, setCopied] = useState(false)
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(t.current), [])
  const copy = useCallback(async (text: string) => {
    if (await copyText(text)) {
      setCopied(true)
      clearTimeout(t.current)
      t.current = setTimeout(() => setCopied(false), 1600)
    }
  }, [])
  return { copied, copy }
}

interface Props extends Omit<ButtonProps, 'onClick' | 'children'> {
  value: string
  label?: string
  iconOnly?: boolean
  shortcut?: boolean
}

export function CopyButton({ value, label = 'Copy', iconOnly, shortcut, variant = 'secondary', size = 'sm', ...p }: Props) {
  const { copied, copy } = useCopy()
  const btn = (
    <Button variant={variant} size={iconOnly ? 'icon-sm' : size} disabled={!value} onClick={() => copy(value)} aria-label={copied ? 'Copied' : label} {...p}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={copied ? 'ok' : 'copy'} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.12 }} className="inline-flex items-center gap-2">
          {copied ? <Check className="text-success" /> : <Copy />}
          {!iconOnly && (copied ? 'Copied' : label)}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">{copied ? 'Copied to clipboard' : ''}</span>
    </Button>
  )
  return shortcut ? <Tooltip label={label} shortcut="Mod+Shift+C">{btn}</Tooltip> : btn
}
