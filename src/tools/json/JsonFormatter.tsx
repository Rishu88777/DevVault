import { useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox, Select } from '@/components/ui/fields'
import { Pills } from '@/components/ui/tabs'
import { CodeEditor, type CodeEditorHandle } from '@/components/common/CodeEditor'
import { ClearButton } from '@/components/common/ActionButtons'
import { ToolOutput, ToolSection } from '@/components/tool/parts'
import { useJsonWorker } from '@/hooks/useJsonWorker'
import { useLiveResult } from '@/hooks/useLiveResult'
import { useToolShortcuts } from '@/hooks/useShortcut'
import type { IndentOption } from '@/lib/formatting/json'

const INDENTS = [{ value: '2', label: '2 spaces' }, { value: '3', label: '3 spaces' }, { value: '4', label: '4 spaces' }, { value: '8', label: '8 spaces' }, { value: 'tab', label: 'Tab' }]

/** Formats automatically as you type or paste — no button needed. */
export function JsonFormatter({ initialMode = 'format' }: { initialMode?: 'format' | 'minify' }) {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'format' | 'minify'>(initialMode)
  const [indent, setIndent] = useState('2')
  const [sortKeys, setSortKeys] = useState(false)
  const editor = useRef<CodeEditorHandle>(null)
  const { format } = useJsonWorker()
  const clear = () => setInput('')
  useToolShortcuts({ clear })

  const { value: r, error: fatal } = useLiveResult(
    () => format({ op: mode, text: input, indent: (indent === 'tab' ? 'tab' : Number(indent)) as IndentOption, sortKeys }),
    [input, mode, indent, sortKeys], { enabled: input.trim() !== '' },
  )
  const result = input.trim() ? r : undefined
  const bad = result && !result.ok ? result.error : null
  const output = result?.ok ? result.output : ''

  return (
    <>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Pills label="Mode" value={mode} onChange={setMode} items={[{ value: 'format', label: 'Beautify' }, { value: 'minify', label: 'Minify' }]} />
        {mode === 'format' && <Select value={indent} onChange={setIndent} options={INDENTS} className="w-32" aria-label="Indentation" />}
        <Checkbox label="Sort keys" checked={sortKeys} onChange={setSortKeys} />
        {result?.ok && <span role="status" className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-success"><CheckCircle2 className="size-4" /> Valid JSON</span>}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolSection title="Input" actions={input ? <ClearButton onClick={clear} /> : null}>
          <CodeEditor ref={editor} label="JSON input" value={input} onChange={setInput} errorLine={bad?.line} emptyHint="Paste or type JSON here — it is formatted automatically." height="h-[max(20rem,calc(100dvh-19rem))]" />
        </ToolSection>
        <ToolOutput label={mode === 'minify' ? 'Minified' : 'Formatted'} value={output} language="json" height="h-[max(20rem,calc(100dvh-19rem))]" filename="result.json" mime="application/json" emptyTitle="Formatted JSON appears here." onClear={clear}
          error={bad ? `${bad.message} at line ${bad.line}, column ${bad.column}.` : fatal ? 'Unable to process this JSON.' : null} errorTitle={bad ? 'Invalid JSON' : 'Unable to process JSON'}
          errorAction={bad ? <Button size="sm" onClick={() => editor.current?.jumpTo(bad.position)}>Jump to error</Button> : undefined} />
      </div>
    </>
  )
}

export const JsonMinifier = () => <JsonFormatter initialMode="minify" />
