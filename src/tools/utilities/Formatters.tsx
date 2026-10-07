import { useCallback, useEffect, useState } from 'react'
import { useLiveResult } from '@/hooks/useLiveResult'
import { Select } from '@/components/ui/fields'
import { ToolInput, ToolOutput, ToolSettings } from '@/components/tool/parts'
import { formatXml } from '@/lib/formatting/xml'
import { useToolShortcuts } from '@/hooks/useShortcut'
import { errorMessage } from '@/lib/utils'

/** Shared shell for "paste text → format → output" tools whose engines are lazy-loaded or async. */
function FormatterShell({ inputLabel, empty, run, extra, outputName, mime, language }: {
  inputLabel: string; empty: string; run: (input: string) => Promise<string> | string; extra?: React.ReactNode; outputName: string; mime?: string; language?: 'json' | 'text'
  actionLabel?: string
}) {
  const [input, setInput] = useState('')
  const { value: out = '', error } = useLiveResult(() => run(input), [input, run], { enabled: input.trim() !== '' })
  const err = input.trim() && error ? errorMessage(error) : null
  const clear = () => setInput('')
  useToolShortcuts({ clear })
  return (
    <>
      <ToolInput label={inputLabel} value={input} onChange={setInput} height="h-[max(14rem,34dvh)]" emptyHint={empty} onClear={clear} />
      {extra && <ToolSettings>{extra}</ToolSettings>}
      <ToolOutput label="Output" value={input.trim() ? out : ''} error={err} errorTitle="Unable to format" onClear={clear} filename={outputName} mime={mime} language={language} height="h-[max(14rem,28dvh)]" />
    </>
  )
}

export function YamlFormatter() {
  const [indent, setIndent] = useState('2')
  const [mode, setMode] = useState('yaml')
  return (
    <FormatterShell inputLabel="YAML" empty="Paste YAML to format or convert it." outputName={mode === 'json' ? 'result.json' : 'result.yaml'} mime={mode === 'json' ? 'application/json' : 'text/yaml'} language={mode === 'json' ? 'json' : 'text'}
     
      run={useCallback(async (text: string) => {
        const YAML = await import('yaml')
        const doc = YAML.parseDocument(text)
        if (doc.errors.length) throw new Error(doc.errors[0].message.split('\n')[0])
        return mode === 'json' ? JSON.stringify(doc.toJS(), null, Number(indent)) : doc.toString({ indent: Number(indent) }).trimEnd()
      }, [mode, indent])}
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
    <FormatterShell inputLabel="XML" empty="Paste XML to format it." outputName="result.xml" mime="application/xml"
      run={useCallback((text: string) => {
        const doc = new DOMParser().parseFromString(text, 'application/xml')
        const err = doc.getElementsByTagName('parsererror')[0]
        if (err) throw new Error(`Not well-formed XML: ${(err.textContent ?? '').split('\n').find((l) => l.trim() && !/^This page|^Below is|^Error/i.test(l.trim()))?.trim() ?? 'syntax error'}`)
        return formatXml(text, Number(indent), mode === 'minify')
      }, [mode, indent])}
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
    <FormatterShell inputLabel="SQL" empty="Paste SQL to format it." outputName="query.sql" mime="application/sql"
      run={useCallback(async (text: string) => {
        const { format } = await import('sql-formatter')
        try { return format(text, { language: dialect as 'sql', keywordCase: upper as 'upper', tabWidth: 2 }) } catch (e) { throw new Error(`Could not parse this SQL for the selected dialect. ${errorMessage(e).split('\n')[0]}`) }
      }, [dialect, upper])}
      extra={<>
        <Select label="Dialect" value={dialect} onChange={setDialect} options={DIALECTS.map(([value, label]) => ({ value, label }))} className="w-44" />
        <Select label="Keywords" value={upper} onChange={setUpper} options={[{ value: 'upper', label: 'UPPERCASE' }, { value: 'lower', label: 'lowercase' }, { value: 'preserve', label: 'Preserve' }]} className="w-40" />
      </>} />
  )
}
