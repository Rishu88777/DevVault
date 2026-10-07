import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileNavigation } from './MobileNavigation'
import { PaletteProvider } from './CommandPalette'

export function AppShell() {
  useTheme() // keeps <html class="dark"> in sync with the saved preference
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  useEffect(() => { setMobileOpen(false); window.scrollTo(0, 0) }, [pathname])

  return (
    <PaletteProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-foreground">Skip to content</a>
      <Header onOpenMobile={() => setMobileOpen(true)} />
      <MobileNavigation open={mobileOpen} onClose={closeMobile} />
      <main id="main" tabIndex={-1} className="mx-auto min-h-[calc(100dvh-14rem)] w-full max-w-6xl px-4 py-8 outline-none sm:px-6"><Outlet /></main>
      <Footer />
    </PaletteProvider>
  )
}
