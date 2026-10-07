import { Binary, Braces, Hash, Lock, Globe, Dices, Wrench, type LucideIcon } from 'lucide-react'

export const CATEGORY_IDS = ['Encoding', 'Encryption', 'Hashing', 'JSON', 'Web', 'Generators', 'Utilities'] as const
export type CategoryId = (typeof CATEGORY_IDS)[number]

/** Static class strings (so Tailwind can see them). Every category has its own colour. */
export interface CategoryColor {
  /** icon tile: tinted background + coloured glyph */
  icon: string
  /** small coloured text */
  text: string
  /** panel header strip */
  header: string
  /** thin accent bar */
  bar: string
  /** hover border for chips/cards */
  hover: string
}
export interface Category { id: CategoryId; description: string; icon: LucideIcon; color: CategoryColor }

export const CATEGORIES: Category[] = [
  { id: 'Encoding', description: 'Base64, URL, Hex, Binary, Unicode and HTML entities', icon: Binary,
    color: { icon: 'bg-sky-500/15 text-sky-600 dark:text-sky-400', text: 'text-sky-600 dark:text-sky-400', header: 'bg-sky-500/10 text-sky-700 dark:text-sky-300', bar: 'bg-sky-500', hover: 'hover:border-sky-500/60' } },
  { id: 'Encryption', description: 'AES and RSA with the Web Crypto API', icon: Lock,
    color: { icon: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', text: 'text-violet-600 dark:text-violet-400', header: 'bg-violet-500/10 text-violet-700 dark:text-violet-300', bar: 'bg-violet-500', hover: 'hover:border-violet-500/60' } },
  { id: 'Hashing', description: 'SHA-2, SHA-3, BLAKE2, MD5 and HMAC', icon: Hash,
    color: { icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', text: 'text-amber-600 dark:text-amber-400', header: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', bar: 'bg-amber-500', hover: 'hover:border-amber-500/60' } },
  { id: 'JSON', description: 'Format, compare, explore and convert JSON', icon: Braces,
    color: { icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', header: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500', hover: 'hover:border-emerald-500/60' } },
  { id: 'Web', description: 'JWT, URLs and query strings', icon: Globe,
    color: { icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400', text: 'text-rose-600 dark:text-rose-400', header: 'bg-rose-500/10 text-rose-700 dark:text-rose-300', bar: 'bg-rose-500', hover: 'hover:border-rose-500/60' } },
  { id: 'Generators', description: 'UUIDs, passwords and random strings', icon: Dices,
    color: { icon: 'bg-orange-500/15 text-orange-600 dark:text-orange-400', text: 'text-orange-600 dark:text-orange-400', header: 'bg-orange-500/10 text-orange-700 dark:text-orange-300', bar: 'bg-orange-500', hover: 'hover:border-orange-500/60' } },
  { id: 'Utilities', description: 'Timestamps, colours, regex, CSV, YAML, XML and SQL', icon: Wrench,
    color: { icon: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400', text: 'text-cyan-600 dark:text-cyan-400', header: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300', bar: 'bg-cyan-500', hover: 'hover:border-cyan-500/60' } },
]

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!
