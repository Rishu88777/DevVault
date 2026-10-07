import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PrivacyBadge({ sensitive, className }: { sensitive?: boolean; className?: string }) {
  if (!sensitive) {
    return (
      <p className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        <Lock className="size-3 text-accent" aria-hidden /> Processed locally in your browser
      </p>
    )
  }
  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm', className)}>
      <Lock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <div>
        <p className="font-medium">Processed locally</p>
        <p className="text-muted-foreground">Your input is not uploaded to a server, and keys, tokens and secrets are never saved to storage.</p>
      </div>
    </div>
  )
}
