import { useEffect, useSyncExternalStore } from 'react'
import { usePref } from '@/lib/storage'

export type ThemePref = 'light' | 'dark' | 'system'
const mq = () => window.matchMedia('(prefers-color-scheme: dark)')
const subscribeSystem = (cb: () => void) => { const m = mq(); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) }

export function useTheme() {
  const [pref, setPref] = usePref<ThemePref>('theme', 'dark')
  const systemDark = useSyncExternalStore(subscribeSystem, () => mq().matches, () => true)
  const dark = pref === 'dark' || (pref === 'system' && systemDark)
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('theme-transition')
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
    const t = setTimeout(() => root.classList.remove('theme-transition'), 250)
    return () => clearTimeout(t)
  }, [dark])
  return { pref, setPref, dark }
}
