import { Link } from 'react-router-dom'
import { useSeo } from '@/hooks/useSeo'
import { modKey } from '@/hooks/useShortcut'
import { Kbd } from '@/components/ui/tooltip'
import { visibleTools } from '@/data/tools'

const H = ({ children }: { children: React.ReactNode }) => <h2 className="pt-4 text-lg font-semibold tracking-tight">{children}</h2>

export default function Docs() {
  useSeo({ title: 'Documentation — DevCipher', description: 'Keyboard shortcuts, tool conventions, security notes and how to add a tool to DevCipher.', path: '/docs' })
  const shortcuts: [string, string][] = [[`${modKey} K`, 'Search tools'], [`${modKey} Enter`, 'Run the current tool'], [`${modKey} Shift C`, 'Copy the result'], [`${modKey} L`, 'Clear the current input'], ['Esc', 'Close dialogs']]
  return (
    <article className="mx-auto max-w-3xl space-y-3 leading-relaxed text-foreground/90">
      <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
      <p className="text-muted-foreground">{visibleTools().length} tools, one consistent layout: title → input → options → action → output → copy / download. Each tool ends with a short “How it works”.</p>

      <H>Keyboard shortcuts</H>
      <dl className="divide-y divide-border rounded-lg border border-border">
        {shortcuts.map(([k, v]) => <div key={k} className="flex items-center justify-between px-3 py-2 text-sm"><dt>{v}</dt><dd><Kbd>{k}</Kbd></dd></div>)}
      </dl>

      <H>Cryptography notes</H>
      <ul className="list-disc space-y-1.5 pl-6 text-sm">
        <li><strong>AES</strong> keys are used as raw bytes of exactly 16, 24 or 32 bytes (UTF-8, hex or Base64). GCM uses a 12-byte nonce and a 16-byte tag appended to the ciphertext. CBC and CTR use a 16-byte IV/counter block and are unauthenticated. ECB is intentionally not offered.</li>
        <li>Output layout is <code className="rounded bg-muted px-1">IV ‖ ciphertext(‖ tag)</code> when “Prepend IV” is on. Leave the IV empty to have a secure random one generated.</li>
        <li>If a browser does not support an algorithm, DevCipher shows an error — it never silently substitutes another algorithm.</li>
        <li>Decoding a JWT does not verify it. Use the verification section with the right secret or public key.</li>
        <li>MD5 and SHA-1 are provided for compatibility and checksums only.</li>
      </ul>

      <H>Adding a tool</H>
      <ol className="list-decimal space-y-1.5 pl-6 text-sm">
        <li>Create the tool UI under <code className="rounded bg-muted px-1">src/tools/&lt;name&gt;/</code> using <code className="rounded bg-muted px-1">ToolInput</code>, <code className="rounded bg-muted px-1">ToolSettings</code>, <code className="rounded bg-muted px-1">ToolActions</code> and <code className="rounded bg-muted px-1">ToolOutput</code>. Put pure logic in <code className="rounded bg-muted px-1">src/lib</code> with tests.</li>
        <li>Add one <code className="rounded bg-muted px-1">def({'{…}'})</code> entry to <code className="rounded bg-muted px-1">src/data/tools.ts</code>. Sidebar, home page, search, favourites, SEO pages and the sitemap pick it up automatically.</li>
      </ol>
      <p className="pt-2"><Link to="/privacy" className="text-accent hover:underline">Privacy →</Link></p>
    </article>
  )
}
