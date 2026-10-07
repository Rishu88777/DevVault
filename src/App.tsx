import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Home from '@/pages/Home'

// Home is in the main bundle for fast first paint; every other page and every tool is code-split.
const ToolPage = lazy(() => import('@/pages/ToolPage'))
const CategoryPage = lazy(() => import('@/pages/CategoryPage'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Docs = lazy(() => import('@/pages/Docs'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="tools/:toolId" element={<ToolPage />} />
          <Route path="category/:categoryId" element={<CategoryPage />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="docs" element={<Docs />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
