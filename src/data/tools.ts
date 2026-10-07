import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import {
  Binary, Braces, CalendarClock, FileCode2, FileJson, GitCompare, Hash, Hexagon, KeyRound, Link2, ListTree, Lock, Palette, Regex, ShieldCheck,
  Sigma, Table2, Dices, Fingerprint, FileCog, Code2, Database, Binary as Bin, KeySquare, Globe, Languages, Search, Ticket, type LucideIcon,
} from 'lucide-react'
import type { CategoryId } from './categories'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: CategoryId
  icon: LucideIcon
  path: string
  keywords: string[]
  /** Short beginner-friendly explanation rendered under the tool. */
  howItWorks: { title: string; body: string[] }
  /** Show the stronger "processed locally / never stored" banner (keys, tokens, secrets). */
  sensitive?: boolean
  popular?: boolean
  seoTitle?: string
  seoDescription?: string
  component: LazyExoticComponent<ComponentType>
}

type Def = Omit<ToolDefinition, 'path' | 'component'> & { load: () => Promise<{ default: ComponentType }> }
const def = (d: Def): ToolDefinition => {
  const { load, ...rest } = d
  return { ...rest, path: `/tools/${d.id}`, component: lazy(load) }
}
/** Lazy-load a named export from a module. */
const named = <M extends Record<string, unknown>>(imp: () => Promise<M>, key: keyof M & string) => () =>
  imp().then((m) => ({ default: m[key] as ComponentType }))

const enc = () => import('@/tools/encoding/EncodingTools')

/**
 * THE tool registry. It powers the sidebar, home page, search, recent/favourites and the SEO build step.
 * To add a tool: create its component, then add one `def({...})` entry below.
 */
export const TOOLS: ToolDefinition[] = [
  /* ───────── Encoding ───────── */
  def({ id: 'base64-encoder', name: 'Base64 Encoder', description: 'Encode text or files to Base64', category: 'Encoding', icon: Binary, popular: true,
    keywords: ['base64', 'encode', 'b64', 'binary to text', 'file'], seoTitle: 'Base64 Encoder Online', seoDescription: 'Encode text and files to Base64 directly in your browser with DevCipher.',
    howItWorks: { title: 'How Base64 encoding works', body: ['Base64 represents binary data using 64 printable ASCII characters (A–Z, a–z, 0–9, + and /). Every 3 bytes become 4 characters, so output is about 33% larger. "=" padding fills the last group.', 'Text is first converted to UTF-8 bytes, so emoji and non-Latin scripts encode correctly. Base64 is an encoding, not encryption — anyone can decode it.'] },
    load: named(enc, 'Base64Encoder') }),
  def({ id: 'base64-decoder', name: 'Base64 Decoder', description: 'Decode Base64 back to text', category: 'Encoding', icon: Binary, popular: true,
    keywords: ['base64', 'decode', 'b64', 'text'], seoTitle: 'Base64 Decoder Online', seoDescription: 'Decode Base64 strings to readable text directly in your browser with DevCipher.',
    howItWorks: { title: 'How Base64 decoding works', body: ['Decoding reverses the encoding: each group of 4 Base64 characters becomes 3 bytes. Whitespace is ignored and missing "=" padding is tolerated.', 'The bytes are then read as UTF-8 text. If they are not valid UTF-8 (for example an image), you will see an error instead of garbled characters.'] },
    load: named(enc, 'Base64Decoder') }),
  def({ id: 'base64url-encoder', name: 'Base64URL Encoder', description: 'URL-safe Base64 without padding', category: 'Encoding', icon: Binary,
    keywords: ['base64url', 'url safe', 'jwt', 'encode'],
    howItWorks: { title: 'How Base64URL works', body: ['Base64URL swaps "+" for "-" and "/" for "_" and usually drops "=" padding so the result can be used in URLs, filenames and JWTs without escaping.'] },
    load: named(enc, 'Base64UrlEncoder') }),
  def({ id: 'base64url-decoder', name: 'Base64URL Decoder', description: 'Decode URL-safe Base64', category: 'Encoding', icon: Binary,
    keywords: ['base64url', 'url safe', 'jwt', 'decode'],
    howItWorks: { title: 'How Base64URL decoding works', body: ['The URL-safe alphabet is mapped back to standard Base64, padding is restored, and the bytes are decoded as UTF-8 text.'] },
    load: named(enc, 'Base64UrlDecoder') }),
  def({ id: 'url-encoder', name: 'URL Encoder', description: 'Percent-encode text for URLs', category: 'Encoding', icon: Link2, popular: true,
    keywords: ['url', 'encode', 'percent', 'uri', 'encodeURIComponent', 'query'], seoTitle: 'URL Encoder Online', seoDescription: 'Percent-encode text for safe use in URLs and query strings, locally in your browser.',
    howItWorks: { title: 'How URL encoding works', body: ['Characters that have special meaning in URLs (such as & = ? / and spaces) are replaced with % followed by their UTF-8 bytes in hex, e.g. a space becomes %20.', '"Component" mode (encodeURIComponent) escapes everything except letters, digits and - _ . ! ~ * \' ( ). "Full URL" mode keeps URL structure characters like : / ? #. "Form" mode writes spaces as +.'] },
    load: named(enc, 'UrlEncoder') }),
  def({ id: 'url-decoder', name: 'URL Decoder', description: 'Decode percent-encoded text', category: 'Encoding', icon: Link2,
    keywords: ['url', 'decode', 'percent', 'uri', 'decodeURIComponent'],
    howItWorks: { title: 'How URL decoding works', body: ['Each %XX sequence is converted back into a byte and the bytes are read as UTF-8. A stray % that is not followed by two hex digits is reported as malformed input.'] },
    load: named(enc, 'UrlDecoder') }),
  def({ id: 'hex-encoder', name: 'Hex Encoder', description: 'Convert text to hexadecimal bytes', category: 'Encoding', icon: Hexagon,
    keywords: ['hex', 'hexadecimal', 'encode', 'bytes'],
    howItWorks: { title: 'How hex encoding works', body: ['Each UTF-8 byte is written as two hexadecimal digits (00–ff). "Hello" becomes 48 65 6c 6c 6f.'] },
    load: named(enc, 'HexEncoder') }),
  def({ id: 'hex-decoder', name: 'Hex Decoder', description: 'Convert hexadecimal bytes to text', category: 'Encoding', icon: Hexagon,
    keywords: ['hex', 'hexadecimal', 'decode', 'bytes'],
    howItWorks: { title: 'How hex decoding works', body: ['Pairs of hex digits are turned into bytes, then read as UTF-8. Spaces, commas, colons and 0x prefixes are ignored.'] },
    load: named(enc, 'HexDecoder') }),
  def({ id: 'binary-encoder', name: 'Binary Encoder', description: 'Convert text to 8-bit binary', category: 'Encoding', icon: Bin,
    keywords: ['binary', 'bits', 'encode', '01'],
    howItWorks: { title: 'How binary encoding works', body: ['Text is converted to UTF-8 bytes and each byte is shown as 8 bits. "A" is 01000001.'] },
    load: named(enc, 'BinaryEncoder') }),
  def({ id: 'binary-decoder', name: 'Binary Decoder', description: 'Convert 8-bit binary to text', category: 'Encoding', icon: Bin,
    keywords: ['binary', 'bits', 'decode', '01'],
    howItWorks: { title: 'How binary decoding works', body: ['Groups of 8 bits become bytes, which are read as UTF-8 text. The total number of bits must be a multiple of 8.'] },
    load: named(enc, 'BinaryDecoder') }),
  def({ id: 'unicode-encoder', name: 'Unicode Encoder', description: 'Escape characters as \\uXXXX', category: 'Encoding', icon: Languages,
    keywords: ['unicode', 'escape', 'u+', '\\u', 'utf-16', 'codepoint'],
    howItWorks: { title: 'How Unicode escapes work', body: ['Every character has a code point. \\uXXXX writes it as four hex digits (UTF-16 code unit); characters above U+FFFF use a surrogate pair, or \\u{…} in modern JavaScript.'] },
    load: named(enc, 'UnicodeEncoder') }),
  def({ id: 'unicode-decoder', name: 'Unicode Decoder', description: 'Turn \\uXXXX escapes into text', category: 'Encoding', icon: Languages,
    keywords: ['unicode', 'unescape', 'u+', '\\u', 'decode'],
    howItWorks: { title: 'How Unicode decoding works', body: ['Escapes in the forms \\uXXXX, \\u{X…} and U+XXXX are replaced with the characters they represent. Surrogate pairs combine into a single character.'] },
    load: named(enc, 'UnicodeDecoder') }),
  def({ id: 'html-entity-encoder', name: 'HTML Entity Encoder', description: 'Escape &, <, >, quotes for HTML', category: 'Encoding', icon: Code2,
    keywords: ['html', 'entity', 'escape', 'encode', 'xss', '&amp;'],
    howItWorks: { title: 'How HTML entities work', body: ['Characters that HTML treats specially (& < > " \') are written as entities such as &amp; and &lt; so they display literally. Escaping user content is a key defence against cross-site scripting (XSS).'] },
    load: named(enc, 'HtmlEntityEncoder') }),
  def({ id: 'html-entity-decoder', name: 'HTML Entity Decoder', description: 'Turn entities back into characters', category: 'Encoding', icon: Code2,
    keywords: ['html', 'entity', 'unescape', 'decode', '&amp;'],
    howItWorks: { title: 'How HTML entity decoding works', body: ['Named (&amp;), decimal (&#65;) and hex (&#x41;) entities are replaced with the characters they stand for. Unknown names are left untouched.'] },
    load: named(enc, 'HtmlEntityDecoder') }),

  /* ───────── Encryption ───────── */
  def({ id: 'aes-encryption', name: 'AES Encryption', description: 'Encrypt and decrypt with AES-128/192/256', category: 'Encryption', icon: Lock, popular: true, sensitive: true,
    keywords: ['aes', 'encrypt', 'decrypt', 'gcm', 'cbc', 'ctr', 'symmetric', 'cipher'], seoTitle: 'AES Encryption & Decryption Online', seoDescription: 'Encrypt and decrypt data using AES-128, AES-192 and AES-256 locally in your browser.',
    howItWorks: { title: 'How AES works', body: ['AES is a symmetric encryption algorithm: the same secret key encrypts and decrypts. AES-128, -192 and -256 use 16, 24 and 32-byte keys.', 'GCM is an authenticated mode — it detects tampering and wrong keys, and should be your default. CBC and CTR are unauthenticated: modified ciphertext decrypts to garbage without any error. ECB is not offered because it leaks patterns and the Web Crypto API does not provide it.', 'Never reuse an IV/nonce with the same key. DevCipher generates one with crypto.getRandomValues() when you leave the field empty.'] },
    load: () => import('@/tools/aes/AesTool') }),
  def({ id: 'rsa-tools', name: 'RSA & PEM Tools', description: 'Generate keys, encrypt, decrypt, sign, verify', category: 'Encryption', icon: KeyRound, sensitive: true,
    keywords: ['rsa', 'pem', 'public key', 'private key', 'oaep', 'pss', 'sign', 'verify', 'asymmetric', 'keypair'],
    howItWorks: { title: 'How RSA works', body: ['RSA uses a key pair. The public key can be shared; the private key must stay secret.', 'Encryption: anyone encrypts with the public key, only the private key decrypts (RSA-OAEP). Signing: the private key signs, anyone verifies with the public key (RSA-PSS or PKCS#1 v1.5). Signing does not hide the message, and encryption does not prove who sent it.', 'RSA can only handle small payloads — typically you encrypt a symmetric key, not the data itself. Keys are exported as PEM: SPKI for public keys and PKCS#8 for private keys.'] },
    load: () => import('@/tools/rsa/RsaTool') }),

  /* ───────── Hashing ───────── */
  def({ id: 'hash-generator', name: 'Hash Generator', description: 'MD5, SHA-1/2/3, SHAKE and BLAKE2', category: 'Hashing', icon: Hash, popular: true,
    keywords: ['hash', 'sha256', 'sha1', 'md5', 'sha512', 'sha3', 'blake2', 'shake', 'checksum', 'digest'], seoTitle: 'Hash Generator Online — MD5, SHA-256, SHA-512', seoDescription: 'Generate MD5, SHA-1, SHA-2, SHA-3, SHAKE and BLAKE2 hashes locally in your browser.',
    howItWorks: { title: 'How hashing works', body: ['A hash function turns any input into a fixed-size fingerprint. The same input always gives the same hash, but a tiny change produces a completely different one.', 'Hashing is one-way: a hash cannot be decrypted back to the original. Do not store passwords with plain SHA-256 — use a slow password hashing function such as Argon2, scrypt or bcrypt.', 'SHA-1/256/384/512 use the browser\'s native Web Crypto API. Other algorithms use the audited @noble/hashes library.'] },
    load: named(() => import('@/tools/hash/HashTools'), 'HashGenerator') }),
  def({ id: 'hmac-generator', name: 'HMAC Generator', description: 'Keyed hashes: HMAC-SHA256 and more', category: 'Hashing', icon: Fingerprint, sensitive: true,
    keywords: ['hmac', 'sha256', 'sha512', 'signature', 'mac', 'secret', 'webhook'],
    howItWorks: { title: 'How HMAC works', body: ['HMAC mixes a secret key into a hash so that only someone who knows the key can produce (or check) the result. It proves a message is authentic and unmodified.', 'It is commonly used to sign webhooks and API requests. Compare HMACs with a constant-time comparison in real code.'] },
    load: named(() => import('@/tools/hash/HashTools'), 'HmacGenerator') }),

  /* ───────── JSON ───────── */
  def({ id: 'json-formatter', name: 'JSON Formatter', description: 'Format, validate and minify JSON', category: 'JSON', icon: Braces, popular: true,
    keywords: ['json', 'formatter', 'pretty print', 'minify', 'validator', 'beautify', 'lint'], seoTitle: 'JSON Formatter & Validator Online', seoDescription: 'Format, validate, minify and inspect JSON directly in your browser.',
    howItWorks: { title: 'How the JSON formatter works', body: ['The text is parsed with a strict JSON parser. If it is valid it is re-serialised with your chosen indentation (pretty print) or with no whitespace (minify).', 'When the JSON is invalid, DevCipher shows the line and column of the first problem — common causes are trailing commas, single quotes and unquoted keys.'] },
    load: named(() => import('@/tools/json/JsonTools'), 'JsonFormatter') }),
  def({ id: 'json-comparator', name: 'JSON Comparator', description: 'Find differences between two JSON documents', category: 'JSON', icon: GitCompare, popular: true,
    keywords: ['json', 'compare', 'diff', 'difference', 'comparator', 'changes'],
    howItWorks: { title: 'How JSON comparison works', body: ['Both documents are parsed and compared structurally — not as text — so formatting and key order do not matter by default.', 'Differences are listed by path: added, removed or changed values, including nested objects and arrays. You can also ignore array order, whitespace inside strings, or specific fields such as id or updatedAt.'] },
    load: named(() => import('@/tools/json/JsonTools'), 'JsonComparator') }),
  def({ id: 'json-tree', name: 'JSON Tree Viewer', description: 'Explore JSON as an expandable tree', category: 'JSON', icon: ListTree,
    keywords: ['json', 'tree', 'viewer', 'explorer', 'path', 'inspect'],
    howItWorks: { title: 'How the tree viewer works', body: ['The JSON is parsed and shown as nested nodes. Each node shows its type and, for arrays and objects, how many items it holds. Copy the path (like $.users[0].name) or the value of any node.', 'Children are rendered only when expanded, so large documents stay responsive.'] },
    load: named(() => import('@/tools/json/JsonTools'), 'JsonTree') }),
  def({ id: 'json-to-code', name: 'JSON to Code', description: 'Generate types for TypeScript, Java, Go, Python, C#', category: 'JSON', icon: FileCode2,
    keywords: ['json', 'typescript', 'java', 'go', 'python', 'c#', 'csharp', 'javascript', 'generate', 'types', 'interface', 'class', 'struct'],
    howItWorks: { title: 'How JSON to code works', body: ['The sample is analysed to infer a type tree (strings, numbers, booleans, arrays and nested objects). Array items are merged, so fields missing from some items become optional.', 'Each language is a small generator module over the same type tree, so more languages can be added easily. Check the output — a single sample cannot reveal every possible shape.'] },
    load: named(() => import('@/tools/json/JsonTools'), 'JsonToCode') }),

  /* ───────── Web ───────── */
  def({ id: 'jwt-decoder', name: 'JWT Decoder', description: 'Decode and inspect JSON Web Tokens', category: 'Web', icon: ShieldCheck, popular: true, sensitive: true,
    keywords: ['jwt', 'json web token', 'decode', 'token', 'claims', 'bearer', 'verify', 'auth'],
    howItWorks: { title: 'How JWTs work', body: ['A JWT has three Base64URL parts separated by dots: header, payload and signature. The header and payload are just encoded JSON — anyone can read them.', 'Decoding does NOT verify the signature. Only a successful verification with the correct secret or public key proves the token was issued by someone holding the key and has not been modified. Always check exp, aud and iss on the server too.'] },
    load: named(() => import('@/tools/jwt/JwtTools'), 'JwtDecoder') }),
  def({ id: 'jwt-generator', name: 'JWT Generator', description: 'Create signed HS, RS and ES tokens', category: 'Web', icon: Ticket, sensitive: true,
    keywords: ['jwt', 'generate', 'sign', 'create', 'token', 'hs256', 'rs256', 'es256'],
    howItWorks: { title: 'How JWT signing works', body: ['The header and payload are Base64URL-encoded and signed with HMAC (HS*, shared secret), RSA (RS*, private key) or ECDSA (ES*, private key). Anyone with the key can mint valid tokens.', 'A signature only proves integrity and origin — it does not make the contents secret. Never put passwords or private data in a JWT payload. Unsigned "none" tokens are intentionally not offered.'] },
    load: named(() => import('@/tools/jwt/JwtTools'), 'JwtGenerator') }),
  def({ id: 'url-parser', name: 'URL Parser', description: 'Break a URL into its components', category: 'Web', icon: Globe,
    keywords: ['url', 'parser', 'protocol', 'host', 'port', 'path', 'hash', 'query', 'uri'],
    howItWorks: { title: 'How URL parsing works', body: ['URLs are parsed with the browser\'s built-in URL API, the same one your code uses. Credentials in the URL are shown but sending passwords in URLs is discouraged.'] },
    load: named(() => import('@/tools/url/UrlTools'), 'UrlParser') }),
  def({ id: 'query-parser', name: 'Query String Parser', description: 'Parse and build query strings', category: 'Web', icon: Search,
    keywords: ['query', 'string', 'parameters', 'params', 'search', 'url'],
    howItWorks: { title: 'How query string parsing works', body: ['Pairs separated by & are split at the first =, and both sides are percent-decoded ("+" becomes a space). Repeated keys are kept as separate rows.'] },
    load: named(() => import('@/tools/url/UrlTools'), 'QueryParser') }),

  /* ───────── Generators ───────── */
  def({ id: 'uuid-generator', name: 'UUID Generator', description: 'Generate UUID v4 and v7', category: 'Generators', icon: Fingerprint, popular: true,
    keywords: ['uuid', 'guid', 'v4', 'v7', 'random', 'unique', 'id'], seoTitle: 'UUID Generator Online — v4 & v7',
    howItWorks: { title: 'How UUIDs work', body: ['A UUID is a 128-bit identifier. Version 4 is 122 random bits from crypto.getRandomValues(). Version 7 (RFC 9562) starts with a millisecond timestamp, so values sort by creation time — handy as database keys.', 'DevCipher forces v7 timestamps to increase within a batch. UUIDs are unique, not secret: do not use them as passwords or tokens.'] },
    load: named(() => import('@/tools/generators/Generators'), 'UuidGenerator') }),
  def({ id: 'password-generator', name: 'Password Generator', description: 'Strong random passwords', category: 'Generators', icon: KeySquare, sensitive: true,
    keywords: ['password', 'generator', 'random', 'secure', 'strong', 'passphrase'],
    howItWorks: { title: 'How passwords are generated', body: ['Each character is chosen with crypto.getRandomValues() using rejection sampling, so there is no modulo bias. Math.random() is never used. At least one character of every selected type is included, then the result is securely shuffled.', 'Entropy is length × log₂(alphabet size). 80+ bits is strong for most uses. Store passwords in a password manager.'] },
    load: named(() => import('@/tools/generators/Generators'), 'PasswordGenerator') }),
  def({ id: 'random-string', name: 'Random String Generator', description: 'Secure random strings and tokens', category: 'Generators', icon: Dices, sensitive: true,
    keywords: ['random', 'string', 'token', 'api key', 'secret', 'hex', 'generator'],
    howItWorks: { title: 'How random strings are generated', body: ['Characters are drawn uniformly from the chosen alphabet with crypto.getRandomValues() (rejection sampling avoids bias). For API tokens aim for at least 128 bits of entropy.'] },
    load: named(() => import('@/tools/generators/Generators'), 'RandomStringGenerator') }),

  /* ───────── Utilities ───────── */
  def({ id: 'timestamp-converter', name: 'Timestamp Converter', description: 'Unix timestamps ⇄ human dates', category: 'Utilities', icon: CalendarClock, popular: true,
    keywords: ['timestamp', 'unix', 'epoch', 'date', 'time', 'iso', 'utc', 'milliseconds'],
    howItWorks: { title: 'How Unix timestamps work', body: ['A Unix timestamp counts seconds (or milliseconds) since 1 January 1970 00:00:00 UTC. It is independent of time zones — only the display changes.', 'Auto-detect treats values of 100 billion or more as milliseconds.'] },
    load: named(() => import('@/tools/utilities/Utilities'), 'TimestampConverter') }),
  def({ id: 'number-base', name: 'Number Base Converter', description: 'Binary, octal, decimal, hex and more', category: 'Utilities', icon: Sigma,
    keywords: ['number', 'base', 'binary', 'octal', 'decimal', 'hex', 'radix', 'convert'],
    howItWorks: { title: 'How base conversion works', body: ['The same number can be written in any base from 2 to 36. DevCipher uses arbitrary-precision BigInt, so very large numbers convert exactly.'] },
    load: named(() => import('@/tools/utilities/Utilities'), 'NumberBaseConverter') }),
  def({ id: 'color-converter', name: 'Color Converter', description: 'HEX, RGB and HSL with contrast check', category: 'Utilities', icon: Palette,
    keywords: ['color', 'colour', 'hex', 'rgb', 'hsl', 'converter', 'contrast'],
    howItWorks: { title: 'How colour conversion works', body: ['HEX and RGB describe the red, green and blue channels (0–255). HSL describes hue (0–360°), saturation and lightness, which is often easier to adjust by hand.', 'Contrast ratios follow WCAG: 4.5:1 is the minimum for normal text.'] },
    load: named(() => import('@/tools/utilities/Utilities'), 'ColorConverter') }),
  def({ id: 'regex-tester', name: 'Regex Tester', description: 'Test JavaScript regular expressions', category: 'Utilities', icon: Regex,
    keywords: ['regex', 'regexp', 'regular expression', 'test', 'match', 'pattern'],
    howItWorks: { title: 'How the regex tester works', body: ['Patterns run with the browser\'s JavaScript RegExp engine. Matches are highlighted, and numbered and named capture groups are listed for each match.', 'Beware of catastrophic backtracking: nested quantifiers like (a+)+ can freeze a page on certain inputs. DevCipher caps the number of matches shown at 1,000.'] },
    load: named(() => import('@/tools/utilities/Utilities'), 'RegexTester') }),
  def({ id: 'csv-json', name: 'CSV ⇄ JSON', description: 'Convert between CSV and JSON', category: 'Utilities', icon: Table2,
    keywords: ['csv', 'json', 'convert', 'table', 'spreadsheet', 'excel'],
    howItWorks: { title: 'How CSV and JSON conversion works', body: ['CSV rows become JSON objects keyed by the header row. Quoted fields may contain delimiters, quotes ("") and line breaks. With type detection on, numbers, true/false and null become real JSON values.'] },
    load: named(() => import('@/tools/utilities/Utilities'), 'CsvJson') }),
  def({ id: 'yaml-formatter', name: 'YAML Formatter', description: 'Format, validate and convert YAML', category: 'Utilities', icon: FileCog,
    keywords: ['yaml', 'yml', 'format', 'validate', 'json', 'convert'],
    howItWorks: { title: 'How the YAML formatter works', body: ['YAML is parsed with the "yaml" library (YAML 1.2) and re-written with consistent indentation, or converted to JSON. Comments are dropped when converting to JSON.'] },
    load: named(() => import('@/tools/utilities/Utilities'), 'YamlFormatter') }),
  def({ id: 'xml-formatter', name: 'XML Formatter', description: 'Pretty print, minify and validate XML', category: 'Utilities', icon: FileJson,
    keywords: ['xml', 'format', 'pretty', 'minify', 'validate'],
    howItWorks: { title: 'How the XML formatter works', body: ['The document is first checked for well-formedness with the browser\'s DOMParser, then re-indented (or minified). It does not validate against a schema (XSD/DTD).'] },
    load: named(() => import('@/tools/utilities/Utilities'), 'XmlFormatter') }),
  def({ id: 'sql-formatter', name: 'SQL Formatter', description: 'Format SQL for many dialects', category: 'Utilities', icon: Database,
    keywords: ['sql', 'format', 'query', 'mysql', 'postgres', 'beautify'],
    howItWorks: { title: 'How the SQL formatter works', body: ['Queries are tokenised and re-laid-out with the sql-formatter library according to the selected dialect. Formatting never runs or sends your SQL anywhere.'] },
    load: named(() => import('@/tools/utilities/Utilities'), 'SqlFormatter') }),
]

export const toolById = (id: string) => TOOLS.find((t) => t.id === id)
export const toolsByCategory = (c: CategoryId) => TOOLS.filter((t) => t.category === c)
export const popularTools = () => TOOLS.filter((t) => t.popular)

export const toolTitle = (t: ToolDefinition) => `${t.seoTitle ?? t.name} — DevCipher`
export const toolDescription = (t: ToolDefinition) => t.seoDescription ?? `${t.description} directly in your browser with DevCipher. Nothing is uploaded.`

