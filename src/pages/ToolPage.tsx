import { Suspense, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { toolById, toolDescription, toolTitle } from '@/data/tools'
import { useRecent } from '@/hooks/usePrefs'
import { useSeo } from '@/hooks/useSeo'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ToolContainer } from '@/components/tool/ToolContainer'
import NotFound from './NotFound'

function ToolSkeleton() {
  return (
    <div role="status" aria-label="Loading tool" className="space-y-4">
      <div className="h-6 w-1/3 animate-pulse rounded bg-muted" /><div className="h-48 animate-pulse rounded-lg bg-muted/70" /><div className="h-24 animate-pulse rounded-lg bg-muted/50" />
    </div>
  )
}

export default function ToolPage() {
  const { toolId = '' } = useParams()
  const tool = toolById(toolId)
  const { push } = useRecent()
  const jsonLd = useMemo(() => tool && ({ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, description: toolDescription(tool), applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }), [tool])
  useSeo({ title: tool ? toolTitle(tool) : 'Tool not found — DevCipher', description: tool ? toolDescription(tool) : 'This tool does not exist.', path: tool?.path ?? '/', keywords: tool?.keywords, jsonLd: jsonLd ?? undefined })
  useEffect(() => { if (tool) push(tool.id) }, [tool, push])
  if (!tool) return <NotFound />
  const Tool = tool.component
  return (
    <ToolContainer key={tool.id} tool={tool}>
      <ErrorBoundary><Suspense fallback={<ToolSkeleton />}><Tool /></Suspense></ErrorBoundary>
    </ToolContainer>
  )
}
