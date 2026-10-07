import { Button } from '@/components/ui/button'

/** Inputs longer than this are kept in memory but not rendered in an editable box (browsers choke on multi-megabyte textareas). */
export const INPUT_RENDER_LIMIT = 1_000_000

/** Large pastes bypass the textarea (which would freeze the page) and go straight into state. */
export function interceptLargePaste(e: React.ClipboardEvent<HTMLElement>, onChange: (v: string) => void): void {
  const text = e.clipboardData.getData('text/plain')
  if (text.length > INPUT_RENDER_LIMIT / 4) { e.preventDefault(); onChange(text) }
}

export function LargeInputNotice({ chars, onClear }: { chars: number; onClear: () => void }) {
  return (
    <div className="flex h-full min-h-[8rem] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/40 p-4 text-center">
      <p className="font-medium">Large input loaded — {chars.toLocaleString()} characters</p>
      <p className="max-w-md text-sm text-muted-foreground">It is processed normally, but not shown in the text box so the page stays fast.</p>
      <Button size="sm" onClick={onClear}>Clear</Button>
    </div>
  )
}

