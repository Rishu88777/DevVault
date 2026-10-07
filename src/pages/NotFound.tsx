import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { useSeo } from '@/hooks/useSeo'

export default function NotFound() {
  useSeo({ title: 'Page not found — DevCipher', description: 'This page does not exist.', path: '/' })
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <p className="font-mono text-5xl font-semibold text-accent">404</p>
      <h1 className="text-xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="text-muted-foreground">The tool or page you&apos;re looking for doesn&apos;t exist. Try the search (Ctrl/⌘ K) or head back home.</p>
      <Link to="/" className={buttonVariants({ variant: 'primary' })}>Back to DevCipher</Link>
    </div>
  )
}
