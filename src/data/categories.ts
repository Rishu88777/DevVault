import { Binary, Braces, Hash, Lock, Globe, Dices, Wrench, type LucideIcon } from 'lucide-react'

export const CATEGORY_IDS = ['Encoding', 'Encryption', 'Hashing', 'JSON', 'Web', 'Generators', 'Utilities'] as const
export type CategoryId = (typeof CATEGORY_IDS)[number]

export interface Category { id: CategoryId; description: string; icon: LucideIcon }

export const CATEGORIES: Category[] = [
  { id: 'Encoding', description: 'Base64, URL, Hex, Binary, Unicode and HTML entities', icon: Binary },
  { id: 'Encryption', description: 'AES and RSA with the Web Crypto API', icon: Lock },
  { id: 'Hashing', description: 'SHA-2, SHA-3, BLAKE2, MD5 and HMAC', icon: Hash },
  { id: 'JSON', description: 'Format, compare, explore and convert JSON', icon: Braces },
  { id: 'Web', description: 'JWT, URLs and query strings', icon: Globe },
  { id: 'Generators', description: 'UUIDs, passwords and random strings', icon: Dices },
  { id: 'Utilities', description: 'Timestamps, colours, regex, CSV, YAML, XML and SQL', icon: Wrench },
]

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!
