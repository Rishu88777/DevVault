import { Link } from 'react-router-dom'
import { Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { GITHUB_URL, GithubIcon, LogoMark } from '@/components/common/Logo'
import { modKey } from '@/hooks/useShortcut'
import { usePalette } from './CommandPalette'
import { ThemeMenu } from './ThemeMenu'

export function Header({ collapsed, onToggleSidebar, onOpenMobile }: { collapsed: boolean; onToggleSidebar: () => void; onOpenMobile: () => void }) {
  const { open } = usePalette()
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md sm:px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile} aria-label="Open navigation"><Menu /></Button>
      <Tooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="hidden lg:inline-flex">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={collapsed}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
      </Tooltip>
      <Link to="/" className="flex items-center gap-2 rounded-md px-1 font-semibold tracking-tight" aria-label="DevCipher home"><LogoMark /> <span>DevCipher</span></Link>

      <button type="button" onClick={() => open()} aria-label="Search tools" className="mx-auto hidden h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-input bg-card/60 px-3 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground md:flex">
        <Search className="size-4" aria-hidden /> <span>Search tools…</span>
        <kbd className="ml-auto rounded border border-border bg-muted px-1.5 font-mono text-[10px]">{modKey} K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => open()} aria-label="Search tools"><Search /></Button>
        <ThemeMenu />
        <Tooltip label="GitHub"><a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="DevCipher on GitHub" className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><GithubIcon className="size-[18px]" /></a></Tooltip>
      </div>
    </header>
  )
}
