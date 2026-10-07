import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/fields'
import { Tooltip } from '@/components/ui/tooltip'
import { ToolActions, ToolInput, ToolOutput, ToolSettings } from '@/components/tool/parts'
import { formatXml } from '@/lib/formatting/xml'
import { useToolShortcuts } from '@/hooks/useShortcut'
import { errorMessage } from '@/lib/utils'
import { Wand2 } from 'lucide-react'

/** Shared shell for "paste text → format → output" tools whose engines are lazy-loaded or async. */
function FormatterShell({ inputLabel, empty, run, extra, outputName, mime, language, actionLabel }: {
  inputLabel: string; empty: string; run: (input: string) => Promise<string> | string; extra?: React.ReactNode; outputName: string; mime?: string; language?: 'json' | 'text'
  actionLabel: string
}) {
  const [input, setInput] = useState('')
  const [out, setOut] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const exec = async () => {
    if (!input.trim()) return
    setBusy(true)
    try { setOut(await run(input)); setError(null) } catch (e) { setOut(''); setError(errorMessage(e)) } finally { setBusy(false) }
  }
  const clear = () => { setInput(''); setOut(''); setError(null) }
  useToolShortcuts({ run: exec, clear })
  return (
    <>
      <ToolInput label={inputLabel} value={input} onChange={setInput} rows={10} emptyHint={empty} onClear={clear} />
      {extra && <ToolSettings>{extra}</ToolSettings>}
      <ToolActions>
        <Tooltip label={actionLabel} shortcut="Mod+Enter" side="top"><Button variant="primary" onClick={exec} disabled={!input.trim() || busy}><Wand2 /> {actionLabel}</Button></Tooltip>
        {busy && <span className="text-sm text-muted-foreground">Working…</span>}
      </ToolActions>
      <ToolOutput label="Output" value={out} error={error} errorTitle="Unable to format" onClear={clear} filename={outputName} mime={mime} language={language} height="h-72" />
    </>
  )
}

export function YamlFormatter() {
  const [indent, setIndent] = useState('2')
  const [mode, setMode] = useState('yaml')
  return (
    <FormatterShell inputLabel="YAML" empty="Paste YAML to format or convert it." outputName={mode === 'json' ? 'result.json' : 'result.yaml'} mime={mode === 'json' ? 'application/json' : 'text/yaml'} language={mode === 'json' ? 'json' : 'text'}
      actionLabel={mode === 'json' ? 'Convert to JSON' : 'Format'}
      run={async (text) => {
        const YAML = await import('yaml')
        const doc = YAML.parseDocument(text)
        if (doc.errors.length) throw new Error(doc.errors[0].message.split('\n')[0])
        return mode === 'json' ? JSON.stringify(doc.toJS(), null, Number(indent)) : doc.toString({ indent: Number(indent) }).trimEnd()
      }}
      extra={<>
        <Select label="Output" value={mode} onChange={setMode} options={[{ value: 'yaml', label: 'Formatted YAML' }, { value: 'json', label: 'JSON' }]} className="w-44" />
        <Select label="Indentation" value={indent} onChange={setIndent} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }]} className="w-36" />
      </>} />
  )
}

export function XmlFormatter() {
  const [indent, setIndent] = useState('2')
  const [mode, setMode] = useState('format')
  return (
    <FormatterShell inputLabel="XML" empty="Paste XML to format it." outputName="result.xml" mime="application/xml" actionLabel={mode === 'minify' ? 'Minify' : 'Format'}
      run={(text) => {
        const doc = new DOMParser().parseFromString(text, 'application/xml')
        const err = doc.getElementsByTagName('parsererror')[0]
        if (err) throw new Error(`Not well-formed XML: ${(err.textContent ?? '').split('\n').find((l) => l.trim() && !/^This page|^Below is|^Error/i.test(l.trim()))?.trim() ?? 'syntax error'}`)
        return formatXml(text, Number(indent), mode === 'minify')
      }}
      extra={<>
        <Select label="Action" value={mode} onChange={setMode} options={[{ value: 'format', label: 'Pretty print' }, { value: 'minify', label: 'Minify' }]} className="w-40" />
        <Select label="Indentation" value={indent} onChange={setIndent} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }]} className="w-36" />
      </>} />
  )
}

const DIALECTS = [['sql', 'Standard SQL'], ['mysql', 'MySQL'], ['postgresql', 'PostgreSQL'], ['sqlite', 'SQLite'], ['transactsql', 'T-SQL'], ['plsql', 'PL/SQL'], ['bigquery', 'BigQuery']] as const

export function SqlFormatter() {
  const [dialect, setDialect] = useState('sql')
  const [upper, setUpper] = useState('upper')
  useEffect(() => { void import('sql-formatter') }, []) // warm the chunk
  return (
    <FormatterShell inputLabel="SQL" empty="Paste SQL to format it." outputName="query.sql" mime="application/sql" actionLabel="Format"
      run={async (text) => {
        const { format } = await import('sql-formatter')
        try { return format(text, { language: dialect as 'sql', keywordCase: upper as 'upper', tabWidth: 2 }) } catch (e) { throw new Error(`Could not parse this SQL for the selected dialect. ${errorMessage(e).split('\n')[0]}`) }
      }}
      extra={<>
        <Select label="Dialect" value={dialect} onChange={setDialect} options={DIALECTS.map(([value, label]) => ({ value, label }))} className="w-44" />
        <Select label="Keywords" value={upper} onChange={setUpper} options={[{ value: 'upper', label: 'UPPERCASE' }, { value: 'lower', label: 'lowercase' }, { value: 'preserve', label: 'Preserve' }]} className="w-40" />
      </>} />
  )
}
