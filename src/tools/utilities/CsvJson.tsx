import { useMemo, useState } from 'react'
import { Checkbox, Select } from '@/components/ui/fields'
import { Tabs } from '@/components/ui/tabs'
import { ToolInput, ToolOutput, ToolSettings } from '@/components/tool/parts'
import { csvToJson, jsonToCsv } from '@/lib/formatting/csv'
import { parseJson } from '@/lib/formatting/json'
import { errorMessage } from '@/lib/utils'
import { useToolShortcuts } from '@/hooks/useShortcut'

export function CsvJson() {
  const [dir, setDir] = useState<'csv2json' | 'json2csv'>('csv2json')
  const [input, setInput] = useState('')
  const [delimiter, setDelimiter] = useState(',')
  const [header, setHeader] = useState(true)
  const [infer, setInfer] = useState(true)
  useToolShortcuts({ clear: () => setInput('') })

  const res = useMemo(() => {
    if (!input.trim()) return { out: '', error: null as string | null }
    try {
      if (dir === 'csv2json') return { out: JSON.stringify(csvToJson(input, { delimiter, header, infer }), null, 2), error: null }
      const p = parseJson(input)
      if (!p.ok) throw new Error(`Invalid JSON: ${p.error.message} at line ${p.error.line}, column ${p.error.column}.`)
      return { out: jsonToCsv(p.value, delimiter), error: null }
    } catch (e) { return { out: '', error: errorMessage(e) } }
  }, [dir, input, delimiter, header, infer])

  return (
    <>
      <Tabs label="Direction" value={dir} onChange={(d) => { setDir(d); setInput('') }} items={[{ value: 'csv2json', label: 'CSV → JSON' }, { value: 'json2csv', label: 'JSON → CSV' }]} />
      <ToolInput label={dir === 'csv2json' ? 'CSV' : 'JSON (array)'} value={input} onChange={setInput} rows={9} emptyHint={dir === 'csv2json' ? 'Paste CSV to convert it to JSON.' : 'Paste a JSON array to convert it to CSV.'} onClear={() => setInput('')} />
      <ToolSettings>
        <Select label="Delimiter" value={delimiter} onChange={setDelimiter} options={[{ value: ',', label: 'Comma' }, { value: ';', label: 'Semicolon' }, { value: '\t', label: 'Tab' }, { value: '|', label: 'Pipe' }]} className="w-36" />
        {dir === 'csv2json' && <div className="flex gap-5 pb-2"><Checkbox label="First row is header" checked={header} onChange={setHeader} /><Checkbox label="Detect numbers / booleans" checked={infer} onChange={setInfer} /></div>}
      </ToolSettings>
      <ToolOutput label="Output" value={res.out} error={res.error} errorTitle="Unable to convert" onClear={() => setInput('')} language={dir === 'csv2json' ? 'json' : 'text'} filename={dir === 'csv2json' ? 'result.json' : 'result.csv'} mime={dir === 'csv2json' ? 'application/json' : 'text/csv'} height="h-72" />
    </>
  )
}
