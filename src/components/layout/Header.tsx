import { Link, NavLink } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { TOP_NAV_IDS, toolById } from '@/data/tools'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { GITHUB_URL, GithubIcon, LogoMark } from '@/components/common/Logo'
import { modKey } from '@/hooks/useShortcut'
import { cn } from '@/lib/utils'
import { AllToolsMenu } from './AllToolsMenu'
import { usePalette } from './CommandPalette'
import { ThemeMenu } from './ThemeMenu'

const navItems = TOP_NAV_IDS.map(toolById).filter((t) => !!t)

export function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { open } = usePalette()
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[96rem] items-center gap-1 px-3 sm:px-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile} aria-label="Open navigation"><Menu /></Button>
        <Link to="/" className="mr-3 flex items-center gap-2 rounded-md px-1 font-semibold tracking-tight" aria-label="DevCipher home"><LogoMark /> <span>DevCipher</span></Link>

        <nav aria-label="Popular tools" className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((t, i) => (
            <NavLink key={t!.id} to={t!.path} className={({ isActive }) => cn('whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors', i > 3 && 'hidden xl:block', isActive ? 'bg-accent/10 font-medium text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>{t!.name}</NavLink>
          ))}
          <AllToolsMenu />
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => open()} aria-label="Search tools" className="hidden h-9 items-center gap-2 rounded-lg border border-input bg-card/60 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground 2xl:flex">
            <Search className="size-4" aria-hidden /> Search <kbd className="ml-3 whitespace-nowrap rounded border border-border bg-muted px-1.5 font-mono text-[10px]">{modKey} K</kbd>
          </button>
          <Button variant="ghost" size="icon" className="2xl:hidden" onClick={() => open()} aria-label="Search tools"><Search /></Button>
          <ThemeMenu />
          <Tooltip label="GitHub"><a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="DevCipher on GitHub" className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><GithubIcon className="size-[18px]" /></a></Tooltip>
        </div>
      </div>
    </header>
  )
}
