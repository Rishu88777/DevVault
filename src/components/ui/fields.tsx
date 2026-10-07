import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const field = 'w-full rounded-md border-2 border-input bg-muted/40 px-3 text-sm transition-colors placeholder:text-muted-foreground/80 hover:border-muted-foreground/50 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:opacity-50'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, 'h-10 text-[15px]', className)} {...p} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} spellCheck={false} autoCapitalize="off" autoCorrect="off" className={cn(field, 'min-h-[7rem] resize-y py-2.5 font-mono text-[15px] leading-6', className)} {...p} />
))
Textarea.displayName = 'Textarea'

export function Field({ label, hint, children, className, htmlFor }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        {hint && <span className="font-normal text-muted-foreground/70">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
  label?: ReactNode
  hint?: ReactNode
}
export function Select({ value, onChange, options, label, hint, className, ...p }: SelectProps) {
  const id = useId()
  const el = (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn(field, 'h-10 cursor-pointer appearance-none pr-8 text-[15px]', className)} {...p}>
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 top-3 size-4 text-muted-foreground" />
    </div>
  )
  return label ? <Field label={label} hint={hint} htmlFor={id}>{el}</Field> : el
}

export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean }) {
  return (
    <label className={cn('flex cursor-pointer select-none items-center gap-2 text-sm', disabled && 'cursor-not-allowed opacity-50')}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="flex size-4 items-center justify-center rounded border border-input bg-background transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
        <svg viewBox="0 0 16 16" className={cn('size-3 text-accent-foreground transition-opacity', checked ? 'opacity-100' : 'opacity-0')} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3.5 8.5l3 3 6-7" /></svg>
      </span>
      {label}
    </label>
  )
}
