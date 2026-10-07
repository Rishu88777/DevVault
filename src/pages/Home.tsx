import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Lock, Search } from 'lucide-react'
import { CATEGORIES } from '@/data/categories'
import { TOP_NAV_IDS, popularTools, toolById, toolsByCategory, type ToolDefinition } from '@/data/tools'
import { useRecent } from '@/hooks/usePrefs'
import { useSeo } from '@/hooks/useSeo'
import { modKey } from '@/hooks/useShortcut'
import { usePalette } from '@/components/layout/CommandPalette'
import { ToolGrid } from '@/components/common/ToolCard'
import { Button } from '@/components/ui/button'

function Section({ id, title, subtitle, children, action }: { id?: string; title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id ?? title}-h`} className="scroll-mt-20 space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div><h2 id={`${id ?? title}-h`} className="text-lg font-semibold tracking-tight">{title}</h2>{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function Home() {
  useSeo({
    title: 'DevCipher — Free Online Developer Tools',
    description: 'Privacy-first developer tools for encoding, encryption, hashing, JSON formatting, JWT, URL utilities and more. Everything runs locally in your browser.',
    path: '/',
    jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'DevCipher', description: 'Developer tools that run locally in your browser.' },
  })
  const { open } = usePalette()
  const { recent, clear } = useRecent()
  const recents = recent.map(toolById).filter((t): t is ToolDefinition => !!t).slice(0, 4)
  const link = (id: string) => { const t = toolById(id)!; return <Link to={t.path} className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-accent">{t.name}</Link> }

  return (
    <div className="mx-auto max-w-6xl space-y-14">
      <section className="relative pt-2 text-center sm:pt-8" aria-labelledby="hero-h">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
          <p className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground"><Lock className="size-3 text-accent" aria-hidden /> Processed locally in your browser</p>
          <h1 id="hero-h" className="text-4xl font-semibold tracking-tight sm:text-5xl">DevCipher</h1>
          <p className="mt-3 text-xl font-medium text-foreground/90 sm:text-2xl">Encode. Encrypt. Decode. Transform.</p>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">A fast, privacy-first toolbox for developers. Everything runs locally in your browser — no servers, no accounts, no uploads.</p>
          <button type="button" onClick={() => open()} aria-label="Search tools" className="mx-auto mt-6 flex h-12 w-full max-w-lg items-center gap-3 rounded-xl border border-input bg-card px-4 text-left text-muted-foreground shadow-card transition-colors hover:border-accent/50">
            <Search className="size-4" aria-hidden /> <span className="flex-1">Search tools…</span><kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{modKey} K</kbd>
          </button>
        </motion.div>
      </section>

      {recents.length > 0 && (
        <Section title="Recently used" action={<Button variant="ghost" size="sm" onClick={clear}>Clear</Button>}><ToolGrid tools={recents} /></Section>
      )}
      <Section id="popular" title="Popular tools" subtitle="The tools developers reach for most."><ToolGrid tools={[...TOP_NAV_IDS.map(toolById).filter((t): t is ToolDefinition => !!t), ...popularTools().filter((t) => !TOP_NAV_IDS.includes(t.id))]} /></Section>
      {CATEGORIES.map((c) => (
        <Section key={c.id} id={c.id.toLowerCase()} title={c.id === 'Web' ? 'Web utilities' : c.id} subtitle={c.description} action={<Link to={`/category/${c.id}`} className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>}>
          <ToolGrid tools={toolsByCategory(c.id)} />
        </Section>
      ))}

      <section className="space-y-3 rounded-xl border border-border bg-card/50 p-6 text-sm leading-relaxed text-muted-foreground" aria-labelledby="about-h">
        <h2 id="about-h" className="text-base font-semibold text-foreground">Developer tools that run locally in your browser</h2>
        <p>DevCipher puts the everyday utilities in one place: a {link('base64-encoder')} and {link('base64-decoder')}, a {link('json-formatter')} and {link('json-comparator')}, {link('aes-encryption')} for encryption and decryption, a {link('hash-generator')}, a {link('jwt-decoder')}, a {link('url-encoder')} and a {link('uuid-generator')} — plus timestamps, regex, CSV, YAML, XML and SQL tools.</p>
        <p>Your API keys, tokens, passwords and JSON payloads are processed by your own browser using the Web Crypto API and standard browser features. Nothing is uploaded, and there is no backend to upload to. <Link to="/privacy" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-accent">Read how privacy works</Link>.</p>
      </section>
    </div>
  )
}
