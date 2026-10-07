import { useMemo, useState } from 'react'
import { Input, Select, Field } from '@/components/ui/fields'
import { CodeEditor } from '@/components/common/CodeEditor'
import { ClearButton } from '@/components/common/ActionButtons'
import { ToolOutput, ToolSection, ToolSettings } from '@/components/tool/parts'
import { CODE_GENERATORS, generateCode } from '@/lib/codegen'
import { parseJson } from '@/lib/formatting/json'
import { useToolShortcuts } from '@/hooks/useShortcut'

export function JsonToCode() {
  const [input, setInput] = useState('')
  const [lang, setLang] = useState('typescript')
  const [root, setRoot] = useState('Root')
  const gen = CODE_GENERATORS.find((g) => g.id === lang)!
  useToolShortcuts({ clear: () => setInput('') })

  const result = useMemo(() => {
    if (!input.trim()) return { out: '', error: null as string | null }
    const p = parseJson(input)
    if (!p.ok) return { out: '', error: `${p.error.message} at line ${p.error.line}, column ${p.error.column}.` }
    try { return { out: generateCode(p.value, lang, root.trim() || 'Root'), error: null } } catch { return { out: '', error: 'Unable to generate code for this JSON.' } }
  }, [input, lang, root])

  return (
    <>
      <ToolSection title="JSON sample" actions={input ? <ClearButton onClick={() => setInput('')} /> : null}>
        <CodeEditor label="JSON sample" value={input} onChange={setInput} height="h-64" emptyHint="Paste a JSON sample to generate types." />
      </ToolSection>
      <ToolSettings>
        <Select label="Language" value={lang} onChange={setLang} options={CODE_GENERATORS.map((g) => ({ value: g.id, label: g.label }))} className="w-52" />
        <Field label="Root type name"><Input value={root} onChange={(e) => setRoot(e.target.value)} className="w-44" aria-label="Root type name" /></Field>
      </ToolSettings>
      <ToolOutput label={`${gen.label} output`} value={result.out} error={result.error} errorTitle="Invalid JSON" onClear={() => setInput('')} filename={`types.${gen.extension}`} height="h-72" emptyTitle="Generated code will appear here." />
    </>
  )
}
