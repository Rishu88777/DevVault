import { useRef, useState } from 'react'
import { CheckCircle2, Minimize2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/fields'
import { Checkbox } from '@/components/ui/fields'
import { Tooltip } from '@/components/ui/tooltip'
import { CodeEditor, type CodeEditorHandle } from '@/components/common/CodeEditor'
import { ClearButton } from '@/components/common/ActionButtons'
import { ToolActions, ToolOutput, ToolSection, ToolSettings } from '@/components/tool/parts'
import { useJsonWorker } from '@/hooks/useJsonWorker'
import { useToolShortcuts } from '@/hooks/useShortcut'
import type { IndentOption, JsonErrorInfo } from '@/lib/formatting/json'
import { errorMessage } from '@/lib/utils'

const INDENTS = [{ value: '2', label: '2 spaces' }, { value: '3', label: '3 spaces' }, { value: '4', label: '4 spaces' }, { value: '8', label: '8 spaces' }, { value: 'tab', label: 'Tab' }]

export function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [valid, setValid] = useState(false)
  const [error, setError] = useState<JsonErrorInfo | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)
  const [indent, setIndent] = useState('2')
  const [sortKeys, setSortKeys] = useState(false)
  const [busy, setBusy] = useState(false)
  const editor = useRef<CodeEditorHandle>(null)
  const { format } = useJsonWorker()

  const run = async (op: 'format' | 'minify' | 'validate') => {
    if (!input.trim()) return
    setBusy(true); setFatal(null)
    try {
      const r = await format({ op, text: input, indent: (indent === 'tab' ? 'tab' : Number(indent)) as IndentOption, sortKeys })
      if (r.ok) { setError(null); setValid(true); setOutput(op === 'validate' ? output : r.output) }
      else { setError(r.error); setValid(false); setOutput('') }
    } catch (e) { setFatal(errorMessage(e)) } finally { setBusy(false) }
  }
  const clear = () => { setInput(''); setOutput(''); setError(null); setValid(false); setFatal(null) }
  useToolShortcuts({ run: () => run('format'), clear })

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolSection title="Input" actions={input ? <ClearButton onClick={clear} /> : null}>
          <CodeEditor ref={editor} label="JSON input" value={input} onChange={(v) => { setInput(v); setError(null) }} errorLine={error?.line} emptyHint="Paste JSON to get started." />
        </ToolSection>
        <ToolOutput label="Output" value={output} language="json" height="h-80" filename="result.json" mime="application/json" emptyTitle="Formatted JSON will appear here." shortcuts
          error={error ? `${error.message} at line ${error.line}, column ${error.column}.` : fatal} errorTitle={error ? 'Invalid JSON' : 'Unable to process JSON'}
          errorAction={error ? <Button size="sm" onClick={() => editor.current?.jumpTo(error.position)}>Jump to error</Button> : undefined} />
      </div>
      <ToolSettings>
        <Select label="Indentation" value={indent} onChange={setIndent} options={INDENTS} className="w-36" />
        <div className="pb-2"><Checkbox label="Sort keys" checked={sortKeys} onChange={setSortKeys} /></div>
      </ToolSettings>
      <ToolActions>
        <Tooltip label="Format" shortcut="Mod+Enter" side="top"><Button variant="primary" onClick={() => run('format')} disabled={!input.trim() || busy}><Wand2 /> Format</Button></Tooltip>
        <Button onClick={() => run('minify')} disabled={!input.trim() || busy}><Minimize2 /> Minify</Button>
        <Button onClick={() => run('validate')} disabled={!input.trim() || busy}><CheckCircle2 /> Validate</Button>
        {valid && !error && <span role="status" className="inline-flex items-center gap-1.5 text-sm text-success"><CheckCircle2 className="size-4" /> Valid JSON</span>}
        {busy && <span className="text-sm text-muted-foreground">Working…</span>}
      </ToolActions>
    </>
  )
}
