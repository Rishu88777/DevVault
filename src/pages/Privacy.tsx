import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'

const H = ({ children }: { children: React.ReactNode }) => <h2 className="pt-4 text-lg font-semibold tracking-tight">{children}</h2>

export default function Privacy() {
  useSeo({ title: 'Privacy — DevCipher', description: 'DevCipher runs entirely in your browser. No backend, no accounts, no analytics. Learn what is and is not stored locally.', path: '/privacy' })
  return (
    <article className="mx-auto max-w-3xl space-y-3 leading-relaxed text-foreground/90">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="size-3 text-accent" aria-hidden /> Processed locally in your browser</p>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-lg text-muted-foreground">Your data stays in your browser.</p>
      </header>

      <H>No backend processing</H>
      <p>DevCipher is a static website. There is no application server, database or API behind it. When you paste a JWT, an API key, a JSON payload or a password into a tool, it is handled by JavaScript running on your device and is never transmitted by DevCipher.</p>

      <H>Local browser execution</H>
      <p>Cryptography uses your browser&apos;s built-in Web Crypto API wherever it supports the algorithm (SHA-1/2, HMAC, AES, RSA, ECDSA). A small number of algorithms the browser lacks (MD5, SHA-224, SHA-3, SHAKE, BLAKE2) use the open-source <code className="rounded bg-muted px-1">@noble/hashes</code> library, bundled with the site. Random values come from <code className="rounded bg-muted px-1">crypto.getRandomValues()</code>.</p>
      <p>Production builds ship with a Content Security Policy that forbids network requests from the page (<code className="rounded bg-muted px-1">connect-src &apos;none&apos;</code>). Fonts are bundled, not loaded from a third party, and there are no analytics or tracking scripts.</p>

      <H>What is saved in localStorage</H>
      <p>Only small, non-sensitive preferences, so the site feels the same next time:</p>
      <ul className="list-disc space-y-1 pl-6"><li>Theme (light, dark or system)</li><li>Whether the sidebar is collapsed, and which sidebar groups are closed</li><li>IDs of your favourite tools</li><li>IDs of recently used tools (only the tool ID — never what you typed)</li></ul>

      <H>What is never saved</H>
      <ul className="list-disc space-y-1 pl-6"><li>Anything you type or paste into a tool: text, JSON, tokens, keys, passwords, ciphertext</li><li>Generated passwords, UUIDs, keys and tokens</li><li>Files you open with a tool</li></ul>
      <p>Tool inputs live only in memory. Reload or close the page, or press Clear, and they are gone. You can remove saved preferences at any time by clearing this site&apos;s data in your browser settings.</p>

      <H>Honest limits</H>
      <p>Running locally removes the server from the picture, but it can&apos;t protect against everything: browser extensions can read page contents, clipboard managers can store what you copy, and a compromised device is a compromised device. For highly sensitive production secrets, prefer offline tools and rotate anything you are unsure about. If analytics or other third-party services are ever added, this page will be updated first.</p>
      <p className="pt-2"><Link to="/" className="text-accent hover:underline">← Back to DevCipher</Link></p>
    </article>
  )
}
