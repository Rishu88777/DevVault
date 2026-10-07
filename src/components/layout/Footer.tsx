import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { GITHUB_URL, LogoMark } from '@/components/common/Logo'

const col = 'space-y-2 text-sm'
const a = 'text-muted-foreground transition-colors hover:text-foreground'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-10 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-6">
        <div className="space-y-2">
          <p className="flex items-center gap-2 font-semibold"><LogoMark className="size-6" /> DevCipher</p>
          <p className="text-sm text-muted-foreground">Privacy-first developer tools.</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="size-3 text-accent" aria-hidden /> Processed locally in your browser</p>
        </div>
        <nav aria-label="Tool categories" className={col}>
          <p className="font-medium">Tools</p>
          {['Encoding', 'Encryption', 'Hashing', 'JSON', 'Utilities'].map((c) => <Link key={c} to={`/category/${c}`} className={`block ${a}`}>{c}</Link>)}
        </nav>
        <nav aria-label="Resources" className={col}>
          <p className="font-medium">Resources</p>
          <Link to="/docs" className={`block ${a}`}>Documentation</Link>
          <Link to="/privacy" className={`block ${a}`}>Privacy</Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={`block ${a}`}>GitHub</a>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">© 2026 DevCipher</div>
    </footer>
  )
}
