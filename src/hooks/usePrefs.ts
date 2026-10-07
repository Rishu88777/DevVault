import { useCallback } from 'react'
import { usePref } from '@/lib/storage'

const EMPTY: string[] = []

export function useFavorites() {
  const [favorites, set] = usePref<string[]>('favorites', EMPTY)
  const toggle = useCallback((id: string) => set((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), [set])
  return { favorites, toggle, isFavorite: (id: string) => favorites.includes(id) }
}

/** Stores tool IDs only — never inputs. */
export function useRecent() {
  const [recent, set] = usePref<string[]>('recent', EMPTY)
  const push = useCallback((id: string) => set((r) => [id, ...r.filter((x) => x !== id)].slice(0, 8)), [set])
  const clear = useCallback(() => set([]), [set])
  return { recent, push, clear }
}

export const useSidebarCollapsed = () => usePref<boolean>('sidebar-collapsed', false)
export const useCollapsedGroups = () => usePref<string[]>('collapsed-groups', EMPTY)
