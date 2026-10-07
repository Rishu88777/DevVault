import { useParams } from 'react-router-dom'
import { CATEGORIES } from '@/data/categories'
import { toolsByCategory } from '@/data/tools'
import { useSeo } from '@/hooks/useSeo'
import { ToolGrid } from '@/components/common/ToolCard'
import NotFound from './NotFound'

export default function CategoryPage() {
  const { categoryId = '' } = useParams()
  const cat = CATEGORIES.find((c) => c.id.toLowerCase() === categoryId.toLowerCase())
  useSeo({ title: cat ? `${cat.id} Tools — DevCipher` : 'Not found — DevCipher', description: cat ? `${cat.description}. Free, private and running locally in your browser.` : '', path: cat ? `/category/${cat.id}` : '/' })
  if (!cat) return <NotFound />
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-start gap-3.5">
        <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-accent"><cat.icon className="size-5" aria-hidden /></span>
        <div><h1 className="text-2xl font-semibold tracking-tight">{cat.id} tools</h1><p className="text-muted-foreground">{cat.description}</p></div>
      </header>
      <ToolGrid tools={toolsByCategory(cat.id)} />
    </div>
  )
}
