import { Download, Eraser } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

export function downloadFile(content: string, filename: string, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function DownloadButton({ value, filename = 'result.txt', mime = 'text/plain', ...p }: { value: string; filename?: string; mime?: string } & Omit<ButtonProps, 'onClick' | 'children'>) {
  return (
    <Button variant="secondary" size="sm" disabled={!value} onClick={() => downloadFile(value, filename, mime)} {...p}>
      <Download /> Download
    </Button>
  )
}

export function ClearButton({ onClick, label = 'Clear', disabled, shortcut = true, ...p }: { onClick: () => void; label?: string; disabled?: boolean; shortcut?: boolean } & Omit<ButtonProps, 'onClick' | 'children'>) {
  const b = (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={disabled} {...p}>
      <Eraser /> {label}
    </Button>
  )
  return shortcut ? <Tooltip label={label} shortcut="Mod+L">{b}</Tooltip> : b
}
