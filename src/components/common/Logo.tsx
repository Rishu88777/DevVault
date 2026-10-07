import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-7', className)}>
      <rect width="32" height="32" rx="8" className="fill-card" />
      <rect x=".75" y=".75" width="30.5" height="30.5" rx="7.25" fill="none" className="stroke-accent/50" strokeWidth="1.5" />
      <path d="M12 13v-2.5a4 4 0 0 1 8 0V13M10 13h12v9a1 1 0 0 1-1 1H11a1 1 0 0 1-1-1v-9Z" fill="none" className="stroke-accent" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="16" cy="18" r="1.5" className="fill-accent" />
    </svg>
  )
}

export const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={cn('size-4', className)} fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.6.23 2.78.12 3.07.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" /></svg>
)

export const GITHUB_URL = 'https://github.com/Rishu88777/DevVault'
