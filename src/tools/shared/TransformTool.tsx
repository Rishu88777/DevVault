import { useMemo, useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox, Select } from '@/components/ui/fields'
import { ToolInput, ToolOutput, ToolSettings } from '@/components/tool/parts'
import { useToolShortcuts } from '@/hooks/useShortcut'
import { errorMessage } from '@/lib/utils'

export type OptionDef =
  | { id: string; type: 'select'; label: string; options: { value: string; label: string }[]; default: string }
  | { id: string; type: 'checkbox'; label: string; default: boolean }
type OptValues = Record<string, string | boolean>

export interface TransformSpec {
  inputLabel?: string
  outputLabel?: string
  placeholder?: string
  emptyHint: string
  options?: OptionDef[]
  run: (input: string, opts: OptValues) => string
  filename?: string
  /** Optional file → output handler (e.g. Base64 of a file). */
  fileHandler?: (bytes: Uint8Array, opts: OptValues) => string
  errorTitle: string
}

/** Declarative live-transform tool: input → options → output. Powers all encoders/decoders. */
export function TransformTool({ spec }: { spec: TransformSpec }) {
  const [input, setInput] = useState('')
  const [opts, setOpts] = useState<OptValues>(() => Object.fromEntries((spec.options ?? []).map((o) => [o.id, o.default])))
  const [file, setFile] = useState<{ name: string; output: string } | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const result = useMemo(() => {
    if (input === '') return { output: '', error: null as string | null }
    try { return { output: spec.run(input, opts), error: null } } catch (e) { return { output: '', error: errorMessage(e) } }
  }, [input, opts, spec])

  const output = file ? file.output : result.output
  const error = file ? fileError : result.error
  const clear = () => { setInput(''); setFile(null); setFileError(null) }
  useToolShortcuts({ clear })

  const onFile = async (f: File | undefined) => {
    if (!f || !spec.fileHandler) return
    try {
      const bytes = new Uint8Array(await f.arrayBuffer())
      setFile({ name: f.name, output: spec.fileHandler(bytes, opts) })
      setFileError(null)
    } catch (e) { setFileError(errorMessage(e)) }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <ToolInput label={spec.inputLabel ?? 'Input'} value={input} onChange={(v) => { setInput(v); setFile(null) }} placeholder={spec.placeholder} emptyHint={spec.emptyHint} onClear={clear}
        actions={spec.fileHandler && <>
          <input ref={fileRef} type="file" className="sr-only" aria-label="Choose a file to encode" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}><FileUp /> Encode a file…</Button>
        </>} />
      {(spec.options?.length ?? 0) > 0 && (
        <ToolSettings>
          {spec.options!.map((o) => o.type === 'select'
            ? <Select key={o.id} label={o.label} value={opts[o.id] as string} onChange={(v) => setOpts((p) => ({ ...p, [o.id]: v }))} options={o.options} className="min-w-40" />
            : <div key={o.id} className="pb-2"><Checkbox label={o.label} checked={opts[o.id] as boolean} onChange={(v) => setOpts((p) => ({ ...p, [o.id]: v }))} /></div>)}
        </ToolSettings>
      )}
      {file && <p className="text-xs text-muted-foreground">Showing the encoded file “{file.name}”.</p>}
      <ToolOutput label={spec.outputLabel ?? 'Output'} value={output} error={error} errorTitle={spec.errorTitle} onClear={clear} filename={spec.filename} wrapLong />
    </>
  )
}
