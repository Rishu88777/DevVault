import { useMemo, useState } from 'react'
import { Field, Input } from '@/components/ui/fields'
import { CopyButton } from '@/components/common/CopyButton'
import { ErrorMessage } from '@/components/common/Feedback'
import { ToolSection, ToolSettings } from '@/components/tool/parts'
import { contrastRatio, parseColor, rgbToHex, rgbToHsl } from '@/lib/formatting/color'
import { errorMessage } from '@/lib/utils'

export function ColorConverter() {
  const [input, setInput] = useState('#10b981')
  const res = useMemo(() => {
    try {
      const rgb = parseColor(input), hsl = rgbToHsl(rgb), hex = rgbToHex(rgb)
      return { ok: true as const, hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, onWhite: contrastRatio(rgb, { r: 255, g: 255, b: 255 }), onBlack: contrastRatio(rgb, { r: 0, g: 0, b: 0 }) }
    } catch (e) { return { ok: false as const, error: errorMessage(e) } }
  }, [input])
  return (
    <>
      <ToolSettings>
        <Field label="Colour" hint="#hex, rgb() or hsl()" className="min-w-56 flex-1"><Input value={input} onChange={(e) => setInput(e.target.value)} className="font-mono" aria-label="Colour value" /></Field>
        <Field label="Picker"><input type="color" aria-label="Colour picker" value={res.ok ? res.hex : '#000000'} onChange={(e) => setInput(e.target.value)} className="h-9 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1" /></Field>
      </ToolSettings>
      {!res.ok && <ErrorMessage title="Invalid colour">{res.error}</ErrorMessage>}
      {res.ok && (
        <>
          <div className="h-24 rounded-lg border border-border" style={{ background: res.hex }} role="img" aria-label={`Swatch ${res.hex}`} />
          <ToolSection title="Formats">
            <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card/50">
              {([['HEX', res.hex], ['RGB', res.rgb], ['HSL', res.hsl]] as const).map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 px-3 py-2 text-sm"><dt className="w-16 text-xs font-medium text-muted-foreground">{k}</dt><dd className="flex-1 font-mono text-[13px]">{v}</dd><CopyButton value={v} iconOnly variant="ghost" aria-label={`Copy ${k}`} /></div>
              ))}
            </dl>
          </ToolSection>
          <ToolSection title="Contrast (WCAG)">
            <div className="grid gap-3 sm:grid-cols-2">
              {([['white', res.onWhite, '#ffffff'], ['black', res.onBlack, '#000000']] as const).map(([n, r, bg]) => (
                <div key={n} className="rounded-lg border border-border p-3" style={{ background: bg }}>
                  <p className="font-medium" style={{ color: res.hex }}>Sample text on {n}</p>
                  <p className="text-xs" style={{ color: bg === '#ffffff' ? '#000' : '#fff' }}>{r.toFixed(2)}:1 — {r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large text only' : 'fails'}</p>
                </div>
              ))}
            </div>
          </ToolSection>
        </>
      )}
    </>
  )
}
