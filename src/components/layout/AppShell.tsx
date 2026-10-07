import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSidebarCollapsed } from '@/hooks/usePrefs'
import { useTheme } from '@/hooks/useTheme'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileNavigation } from './MobileNavigation'
import { PaletteProvider } from './CommandPalette'
import { Sidebar } from './Sidebar'

export function AppShell() {
  useTheme() // keeps <html class="dark"> in sync with the saved preference
  const [collapsed, setCollapsed] = useSidebarCollapsed()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  useEffect(() => { setMobileOpen(false); window.scrollTo(0, 0) }, [pathname])

  return (
    <PaletteProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-foreground">Skip to content</a>
      <Header collapsed={collapsed} onToggleSidebar={() => setCollapsed((c) => !c)} onOpenMobile={() => setMobileOpen(true)} />
      <MobileNavigation open={mobileOpen} onClose={closeMobile} />
      <div className="flex min-h-[calc(100dvh-3.5rem)]">
        <Sidebar collapsed={collapsed} onExpand={() => setCollapsed(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <main id="main" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8"><Outlet /></main>
          <Footer />
        </div>
      </div>
    </PaletteProvider>
  )
}
