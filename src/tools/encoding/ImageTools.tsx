import { useMemo, useRef, useState } from 'react'
import { Download, ImageUp, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { ClearButton } from '@/components/common/ActionButtons'
import { ErrorMessage } from '@/components/common/Feedback'
import { ToolInput, ToolOutput, ToolSection } from '@/components/tool/parts'
import { Pills } from '@/components/ui/tabs'
import { bytesToBase64 } from '@/lib/encoding'
import { parseBase64Image } from '@/lib/encoding/image'
import { cn, errorMessage } from '@/lib/utils'

const kb = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`)

type Fmt = 'uri' | 'base64' | 'img' | 'css'
interface Loaded { name: string; mime: string; size: number; base64: string; w?: number; h?: number }

/** Image (or any file) → Base64 data URI. The file is read by your browser only. */
export function ImageToBase64() {
  const [img, setImg] = useState<Loaded | null>(null)
  const [fmt, setFmt] = useState<Fmt>('uri')
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const load = async (f: File | undefined) => {
    if (!f) return
    setError(null)
    try {
      if (f.size > 25 * 1024 * 1024) throw new Error('Files over 25 MB are not supported — Base64 would be huge.')
      const bytes = new Uint8Array(await f.arrayBuffer())
      const mime = f.type || 'application/octet-stream'
      const base64 = bytesToBase64(bytes)
      const loaded: Loaded = { name: f.name, mime, size: f.size, base64 }
      if (mime.startsWith('image/')) {
        await new Promise<void>((res) => { const i = new Image(); i.onload = () => { loaded.w = i.naturalWidth; loaded.h = i.naturalHeight; res() }; i.onerror = () => res(); i.src = `data:${mime};base64,${base64}` })
      }
      setImg(loaded)
    } catch (e) { setImg(null); setError(errorMessage(e)) }
  }

  const uri = img ? `data:${img.mime};base64,${img.base64}` : ''
  const output = !img ? '' : fmt === 'uri' ? uri : fmt === 'base64' ? img.base64 : fmt === 'img' ? `<img src="${uri}" alt="${img.name}" />` : `background-image: url("${uri}");`
  const isImage = img?.mime.startsWith('image/')

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void load(e.dataTransfer.files[0]) }}
        className={cn('flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors', drag ? 'border-accent bg-accent/10' : 'border-input bg-muted/40')}>
        <span className="flex size-12 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400"><Upload className="size-6" aria-hidden /></span>
        <p className="font-medium">Drag &amp; drop an image here</p>
        <p className="text-sm text-muted-foreground">PNG, JPG, GIF, WebP, SVG, ICO… (any file works) — nothing is uploaded</p>
        <input ref={input} type="file" className="sr-only" aria-label="Choose an image" onChange={(e) => { void load(e.target.files?.[0]); e.target.value = '' }} />
        <Button variant="primary" onClick={() => input.current?.click()}><ImageUp /> Choose image</Button>
      </div>
      {error && <ErrorMessage title="Unable to read this file">{error}</ErrorMessage>}
      {img && (
        <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
          <ToolSection title="Preview" actions={<ClearButton onClick={() => setImg(null)} shortcut={false} />}>
            <div className="flex h-48 items-center justify-center overflow-hidden rounded-md border-2 border-input bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
              {isImage ? <img src={uri} alt={`Preview of ${img.name}`} className="max-h-full max-w-full object-contain" /> : <span className="text-sm text-muted-foreground">No preview</span>}
            </div>
            <dl className="space-y-0.5 text-xs text-muted-foreground"><div className="break-all font-medium text-foreground">{img.name}</div><div>{img.mime} · {kb(img.size)}{img.w ? ` · ${img.w}×${img.h}px` : ''}</div><div>Base64 length: {kb(img.base64.length)} (~33% larger)</div></dl>
          </ToolSection>
          <div className="space-y-3">
            <Pills label="Output format" value={fmt} onChange={setFmt} items={[{ value: 'uri', label: 'Data URI' }, { value: 'base64', label: 'Base64 only' }, { value: 'img', label: 'HTML <img>' }, { value: 'css', label: 'CSS background' }]} />
            <ToolOutput label="Result" value={output} filename={`${img.name.replace(/\.[^.]+$/, '')}.base64.txt`} height="h-48" wrapLong />
          </div>
        </div>
      )}
    </>
  )
}

/** Base64 / data URI → image preview + download. */
export function Base64ToImage() {
  const [text, setText] = useState('')
  const res = useMemo(() => {
    if (!text.trim()) return null
    try { return { ok: true as const, img: parseBase64Image(text) } } catch (e) { return { ok: false as const, error: errorMessage(e) } }
  }, [text])
  const [dims, setDims] = useState('')
  return (
    <>
      <ToolInput label="Base64 or data URI" value={text} onChange={setText} rows={8} emptyHint="Paste a Base64 string or a data:image/…;base64 URI — the image appears automatically." onClear={() => { setText(''); setDims('') }} />
      {res && !res.ok && <ErrorMessage title="Unable to decode image">{res.error}</ErrorMessage>}
      <Panel title="Image preview" category="Encoding">
        {res?.ok ? (
          <div className="space-y-3">
            <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-md border-2 border-input bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-2">
              <img src={res.img.dataUri} alt="Decoded from Base64" onLoad={(e) => setDims(`${e.currentTarget.naturalWidth}×${e.currentTarget.naturalHeight}px`)} className="max-h-96 max-w-full object-contain" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => { const blob = new Blob([res.img.bytes as BlobPart], { type: res.img.mime }); const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = `image.${res.img.ext}`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }}><Download /> Download .{res.img.ext}</Button>
              <span className="text-sm text-muted-foreground">{res.img.mime} · {kb(res.img.bytes.length)}{dims ? ` · ${dims}` : ''}</span>
            </div>
          </div>
        ) : <p className="py-8 text-center text-sm text-muted-foreground">Your decoded image appears here.</p>}
      </Panel>
    </>
  )
}
