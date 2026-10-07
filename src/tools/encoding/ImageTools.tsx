import { useEffect, useRef, useState } from 'react'
import { Download, ImageUp, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pills } from '@/components/ui/tabs'
import { ClearButton } from '@/components/common/ActionButtons'
import { ErrorMessage } from '@/components/common/Feedback'
import { ToolInput, ToolOutput, ToolSection } from '@/components/tool/parts'
import { BULK_THRESHOLD, useBulkWorker } from '@/hooks/useBulkWorker'
import { useLiveResult } from '@/hooks/useLiveResult'
import { base64ToBytes } from '@/lib/encoding/bytes'
import { extractBase64, imageFromBytes } from '@/lib/encoding/image'
import { cn, errorMessage } from '@/lib/utils'

const kb = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`)
const CHECKER = 'bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]'
const MAX_BYTES = 50 * 1024 * 1024

type Fmt = 'uri' | 'base64' | 'img' | 'css'
interface Loaded { name: string; mime: string; size: number; uri: string; preview: string; w?: number; h?: number }

function readAsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('The browser could not read this file.'))
    r.readAsDataURL(f) // native, streaming conversion — much faster than doing it in JavaScript
  })
}

/** Image (or any file) → Base64 data URI. Read and converted by your browser only. */
export function ImageToBase64() {
  const [img, setImg] = useState<Loaded | null>(null)
  const [fmt, setFmt] = useState<Fmt>('uri')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const previewUrl = useRef<string | null>(null)

  const release = () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); previewUrl.current = null }
  useEffect(() => release, [])

  const load = async (f: File | undefined) => {
    if (!f) return
    setError(null); setBusy(true)
    try {
      if (f.size > MAX_BYTES) throw new Error('Files over 50 MB are not supported — the Base64 text would be enormous.')
      const uri = await readAsDataUrl(f)
      release()
      const mime = f.type || uri.slice(5, uri.indexOf(';')) || 'application/octet-stream'
      const preview = URL.createObjectURL(f)
      previewUrl.current = preview
      const loaded: Loaded = { name: f.name, mime, size: f.size, uri, preview }
      if (mime.startsWith('image/')) {
        await new Promise<void>((res) => { const i = new Image(); i.onload = () => { loaded.w = i.naturalWidth; loaded.h = i.naturalHeight; res() }; i.onerror = () => res(); i.src = preview })
      }
      setImg(loaded)
    } catch (e) { setImg(null); setError(errorMessage(e)) } finally { setBusy(false) }
  }

  const b64 = img ? img.uri.slice(img.uri.indexOf(',') + 1) : ''
  const output = !img ? '' : fmt === 'uri' ? img.uri : fmt === 'base64' ? b64 : fmt === 'img' ? `<img src="${img.uri}" alt="${img.name}" />` : `background-image: url("${img.uri}");`
  const isImage = img?.mime.startsWith('image/')

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void load(e.dataTransfer.files[0]) }}
        className={cn('flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors', drag ? 'border-accent bg-accent/10' : 'border-input bg-muted/40')}>
        <span className="flex size-12 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">{busy ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <Upload className="size-6" aria-hidden />}</span>
        <p className="text-lg font-medium">{busy ? 'Converting…' : 'Drag & drop an image here'}</p>
        <p className="text-sm text-muted-foreground">PNG, JPG, GIF, WebP, SVG, ICO… (any file works, up to 50 MB) — nothing is uploaded</p>
        <input ref={input} type="file" className="sr-only" aria-label="Choose an image" onChange={(e) => { void load(e.target.files?.[0]); e.target.value = '' }} />
        <Button variant="primary" disabled={busy} onClick={() => input.current?.click()}><ImageUp /> Choose image</Button>
      </div>
      {error && <ErrorMessage title="Unable to read this file">{error}</ErrorMessage>}
      {img && (
        <div className="grid gap-6 lg:grid-cols-[minmax(18rem,26rem)_1fr]">
          <ToolSection title="Preview" actions={<ClearButton onClick={() => { release(); setImg(null) }} shortcut={false} />}>
            <div className={cn('flex h-[max(14rem,34dvh)] items-center justify-center overflow-hidden rounded-md border-2 border-input', CHECKER)}>
              {isImage ? <img src={img.preview} alt={`Preview of ${img.name}`} className="max-h-full max-w-full object-contain" /> : <span className="text-sm text-muted-foreground">No preview for this file type</span>}
            </div>
            <dl className="space-y-0.5 text-sm text-muted-foreground"><div className="break-all font-medium text-foreground">{img.name}</div><div>{img.mime} · {kb(img.size)}{img.w ? ` · ${img.w}×${img.h}px` : ''}</div><div>Base64 length: {kb(b64.length)} (~33% larger)</div></dl>
          </ToolSection>
          <div className="space-y-3">
            <Pills label="Output format" value={fmt} onChange={setFmt} items={[{ value: 'uri', label: 'Data URI' }, { value: 'base64', label: 'Base64 only' }, { value: 'img', label: 'HTML <img>' }, { value: 'css', label: 'CSS background' }]} />
            <ToolOutput label="Result" value={output} filename={`${img.name.replace(/\.[^.]+$/, '')}.base64.txt`} height="h-[max(14rem,34dvh)]" wrapLong />
          </div>
        </div>
      )}
    </>
  )
}

/** Base64 / data URI → image preview + download. Large inputs are decoded in a worker. */
export function Base64ToImage() {
  const [text, setText] = useState('')
  const [dims, setDims] = useState('')
  const [url, setUrl] = useState<string | null>(null)
  const bulk = useBulkWorker()

  const { value: decoded, error } = useLiveResult(async () => {
    let bytes: Uint8Array
    if (text.length > BULK_THRESHOLD) bytes = new Uint8Array(await bulk<ArrayBuffer>('b64bytes', text))
    else bytes = base64ToBytes(extractBase64(text))
    return { bytes, ...imageFromBytes(bytes) }
  }, [text], { enabled: text.trim() !== '', delay: text.length > 50_000 ? 300 : 120 })

  useEffect(() => {
    if (!decoded) { setUrl(null); return }
    const u = URL.createObjectURL(new Blob([decoded.bytes as BlobPart], { type: decoded.mime })) // blob URL: no giant data: string in the DOM
    setUrl(u); setDims('')
    return () => URL.revokeObjectURL(u)
  }, [decoded])

  const res = text.trim() ? decoded : undefined
  const err = text.trim() && error ? errorMessage(error) : null
  const download = () => {
    if (!res || !url) return
    const a = document.createElement('a'); a.href = url; a.download = `image.${res.ext}`; a.click()
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <ToolInput label="Base64 or data URI" value={text} onChange={setText} height="h-[max(16rem,52dvh)]" emptyHint="Paste a Base64 string or a data:image/…;base64 URI — the image appears automatically." onClear={() => setText('')} />
        {err && <ErrorMessage title="Unable to decode image">{err}</ErrorMessage>}
      </div>
      <ToolSection title="Image preview" actions={res && url ? <Button size="sm" variant="primary" onClick={download}><Download /> Download .{res.ext}</Button> : null}>
        <div className={cn('flex h-[max(16rem,52dvh)] items-center justify-center overflow-hidden rounded-md border-2 border-input p-2', CHECKER)}>
          {res && url ? <img src={url} alt="Decoded from Base64" onLoad={(e) => setDims(`${e.currentTarget.naturalWidth}×${e.currentTarget.naturalHeight}px`)} className="max-h-full max-w-full object-contain" /> : <p className="rounded bg-background/80 px-3 py-2 text-sm text-muted-foreground">Your decoded image appears here.</p>}
        </div>
        {res && <p className="text-sm text-muted-foreground">{res.mime} · {kb(res.bytes.length)}{dims ? ` · ${dims}` : ''}</p>}
      </ToolSection>
    </div>
  )
}
