import { useEffect, useRef } from 'react'

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
export const modKey = isMac ? '⌘' : 'Ctrl'

interface Combo { key: string; mod?: boolean; shift?: boolean; allowInInput?: boolean }

/** Registers a global shortcut; `mod` means Ctrl on Windows/Linux and ⌘ on macOS. */
export function useShortcut(combo: Combo, handler: (e: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== combo.key.toLowerCase()) return
      if (!!combo.mod !== (isMac ? e.metaKey : e.ctrlKey)) return
      if (!!combo.shift !== e.shiftKey) return
      if (e.altKey) return
      e.preventDefault()
      ref.current(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [combo.key, combo.mod, combo.shift, enabled])
}

/** Per-tool shortcuts: Mod+Enter run, Mod+Shift+C copy result, Mod+L clear. */
export function useToolShortcuts(h: { run?: () => void; copy?: () => void; clear?: () => void }) {
  useShortcut({ key: 'Enter', mod: true }, () => h.run?.(), !!h.run)
  useShortcut({ key: 'c', mod: true, shift: true }, () => h.copy?.(), !!h.copy)
  useShortcut({ key: 'l', mod: true }, () => h.clear?.(), !!h.clear)
}
