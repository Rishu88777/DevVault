import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import {
  Binary, Braces, CalendarClock, FileImage, ImageUp, FileCode2, FileJson, GitCompare, Hash, Hexagon, KeyRound, Link2, ListTree, Lock, Palette, Regex, ShieldCheck,
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
  /** SEO landing page that reuses another tool's UI: searchable and in the sitemap, but not listed in menus/grids. */
  hidden?: boolean
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
const CORE: ToolDefinition[] = [
  /* ───────── Encoding ───────── */
  def({ id: 'url-encode-decode', name: 'URL Encode / Decode', description: 'Encode and decode URLs side by side', category: 'Encoding', icon: Link2, popular: true,
    keywords: ['url encode online', 'url decode online', 'url encoder decoder', 'percent encoding', 'urlencode', 'urldecode', 'url', 'encode', 'decode', 'percent', 'uri', 'encodeURIComponent', 'decodeURIComponent', 'query string'], seoTitle: 'URL Encode & Decode Online — Percent Encoding Tool', seoDescription: 'Encode and decode URLs and query strings online. Free URL encoder / decoder (encodeURIComponent, encodeURI, form) that runs locally in your browser.',
    howItWorks: { title: 'How URL encoding works', body: ['Characters that have special meaning in URLs (such as & = ? / and spaces) are replaced with % followed by their UTF-8 bytes in hex, e.g. a space becomes %20. Decoding reverses it.', '"Component" mode (encodeURIComponent) escapes everything except letters, digits and - _ . ! ~ * \' ( ). "Full URL" mode (encodeURI) keeps URL structure characters like : / ? #. "Form" mode writes spaces as +.'] },
    load: named(enc, 'UrlEncodeDecode') }),
  def({ id: 'base64-encode-decode', name: 'Base64 Encode / Decode', description: 'Encode and decode Base64 side by side', category: 'Encoding', icon: Binary, popular: true,
    keywords: ['base64 encode online', 'base64 decode online', 'base64 encoder decoder', 'text to base64', 'base64 to text', 'base64', 'encode', 'decode', 'b64', 'file', 'text to base64', 'base64 to text'], seoTitle: 'Base64 Encode & Decode Online — Text and Files', seoDescription: 'Encode text and files to Base64 or decode Base64 to text online. Free, private and processed locally in your browser.',
    howItWorks: { title: 'How Base64 works', body: ['Base64 represents binary data using 64 printable ASCII characters (A–Z, a–z, 0–9, + and /). Every 3 bytes become 4 characters, so output is about 33% larger. "=" padding fills the last group.', 'Text is first converted to UTF-8 bytes, so emoji and non-Latin scripts work. Base64 is an encoding, not encryption — anyone can decode it.'] },
    load: named(enc, 'Base64EncodeDecode') }),
  def({ id: 'base64-encoder', name: 'Base64 Encoder', description: 'Encode text or files to Base64', category: 'Encoding', icon: Binary, 
    keywords: ['base64', 'encode', 'b64', 'binary to text', 'file'], seoTitle: 'Base64 Encoder Online', seoDescription: 'Encode text and files to Base64 directly in your browser with DevCipher.',
    howItWorks: { title: 'How Base64 encoding works', body: ['Base64 represents binary data using 64 printable ASCII characters (A–Z, a–z, 0–9, + and /). Every 3 bytes become 4 characters, so output is about 33% larger. "=" padding fills the last group.', 'Text is first converted to UTF-8 bytes, so emoji and non-Latin scripts encode correctly. Base64 is an encoding, not encryption — anyone can decode it.'] },
    load: named(enc, 'Base64Encoder') }),
  def({ id: 'base64-decoder', name: 'Base64 Decoder', description: 'Decode Base64 back to text', category: 'Encoding', icon: Binary, 
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
  def({ id: 'url-encoder', name: 'URL Encoder', description: 'Percent-encode text for URLs', category: 'Encoding', icon: Link2, 
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

  /* ───────── Image ⇄ Base64 ───────── */
  def({ id: 'image-to-base64', name: 'Image to Base64', description: 'Convert an image to a Base64 data URI', category: 'Encoding', icon: ImageUp, popular: true,
    keywords: ['image to base64', 'convert image to base64', 'png to base64', 'jpg to base64', 'jpeg to base64', 'svg to base64', 'file to base64', 'data uri', 'base64 image', 'img src base64', 'css background base64'],
    seoTitle: 'Image to Base64 Converter Online — PNG, JPG, SVG to Base64', seoDescription: 'Convert PNG, JPG, GIF, WebP and SVG images to Base64 data URIs, HTML img tags or CSS backgrounds. Free and processed locally — your image is never uploaded.',
    howItWorks: { title: 'How image to Base64 works', body: ['Your browser reads the file\'s raw bytes and writes them as Base64 text. Adding the prefix data:image/png;base64, makes a "data URI" that can be used directly as an <img src> or CSS url() without a separate file request.', 'Base64 is about 33% larger than the original file, so it is best for small images such as icons. The image never leaves your device.'] },
    load: named(() => import('@/tools/encoding/ImageTools'), 'ImageToBase64') }),
  def({ id: 'base64-to-image', name: 'Base64 to Image', description: 'Decode Base64 to an image and download it', category: 'Encoding', icon: FileImage, popular: true,
    keywords: ['base64 to image', 'convert base64 to image', 'base64 to png', 'base64 to jpg', 'base64 to jpeg', 'base64 image decoder', 'data uri to image', 'decode base64 image', 'base64 to file'],
    seoTitle: 'Base64 to Image Converter Online — Decode and Download', seoDescription: 'Paste a Base64 string or data URI to preview and download the image (PNG, JPG, GIF, WebP, SVG). Free and processed locally in your browser.',
    howItWorks: { title: 'How Base64 to image works', body: ['The Base64 text (with or without a data:image/…;base64, prefix) is turned back into bytes. DevCipher then inspects the first bytes ("magic numbers") to detect the real image type instead of trusting the label, shows a preview, and lets you download the file.'] },
    load: named(() => import('@/tools/encoding/ImageTools'), 'Base64ToImage') }),

  /* ───────── Encryption ───────── */
  def({ id: 'aes-encryption', name: 'AES Encrypt / Decrypt', description: 'AES-128/192/256 encryption and decryption', category: 'Encryption', icon: Lock, popular: true, sensitive: true,
    keywords: ['aes encryption online', 'aes decryption online', 'aes encrypt decrypt', 'aes 256 online', 'aes gcm online', 'aes cbc online', 'encrypt text online', 'decrypt text online', 'aes', 'encrypt', 'decrypt', 'gcm', 'cbc', 'ctr', 'symmetric', 'cipher'], seoTitle: 'AES Encryption & Decryption Online — AES-128, 192, 256', seoDescription: 'Encrypt and decrypt data using AES-128, AES-192 and AES-256 locally in your browser.',
    howItWorks: { title: 'How AES works', body: ['AES is a symmetric encryption algorithm: the same secret key encrypts and decrypts. AES-128, -192 and -256 use 16, 24 and 32-byte keys.', 'GCM is an authenticated mode — it detects tampering and wrong keys, and should be your default. CBC and CTR are unauthenticated: modified ciphertext decrypts to garbage without any error. ECB is not offered because it leaks patterns and the Web Crypto API does not provide it.', 'Never reuse an IV/nonce with the same key. DevCipher generates one with crypto.getRandomValues() when you leave the field empty.'] },
    load: () => import('@/tools/aes/AesTool') }),
  def({ id: 'rsa-tools', name: 'RSA & PEM Tools', description: 'Generate keys, encrypt, decrypt, sign, verify', category: 'Encryption', icon: KeyRound, sensitive: true,
    keywords: ['rsa', 'pem', 'public key', 'private key', 'oaep', 'pss', 'sign', 'verify', 'asymmetric', 'keypair'],
    howItWorks: { title: 'How RSA works', body: ['RSA uses a key pair. The public key can be shared; the private key must stay secret.', 'Encryption: anyone encrypts with the public key, only the private key decrypts (RSA-OAEP). Signing: the private key signs, anyone verifies with the public key (RSA-PSS or PKCS#1 v1.5). Signing does not hide the message, and encryption does not prove who sent it.', 'RSA can only handle small payloads — typically you encrypt a symmetric key, not the data itself. Keys are exported as PEM: SPKI for public keys and PKCS#8 for private keys.'] },
    load: () => import('@/tools/rsa/RsaTool') }),

  /* ───────── Hashing ───────── */
  def({ id: 'hash-generator', name: 'Hash Generator', description: 'MD5, SHA-1/2/3, SHAKE and BLAKE2', category: 'Hashing', icon: Hash, popular: true,
    keywords: ['sha256 online', 'md5 online', 'sha512 online', 'hash calculator', 'checksum generator', 'sha1 online', 'hash', 'sha256', 'sha1', 'md5', 'sha512', 'sha3', 'blake2', 'shake', 'checksum', 'digest'], seoTitle: 'Hash Generator Online — MD5, SHA-1, SHA-256, SHA-512', seoDescription: 'Generate MD5, SHA-1, SHA-2, SHA-3, SHAKE and BLAKE2 hashes locally in your browser.',
    howItWorks: { title: 'How hashing works', body: ['A hash function turns any input into a fixed-size fingerprint. The same input always gives the same hash, but a tiny change produces a completely different one.', 'Hashing is one-way: a hash cannot be decrypted back to the original. Do not store passwords with plain SHA-256 — use a slow password hashing function such as Argon2, scrypt or bcrypt.', 'SHA-1/256/384/512 use the browser\'s native Web Crypto API. Other algorithms use the audited @noble/hashes library.'] },
    load: named(() => import('@/tools/hash/HashTools'), 'HashGenerator') }),
  def({ id: 'hmac-generator', name: 'HMAC Generator', description: 'Keyed hashes: HMAC-SHA256 and more', category: 'Hashing', icon: Fingerprint, sensitive: true,
    keywords: ['hmac', 'sha256', 'sha512', 'signature', 'mac', 'secret', 'webhook'],
    howItWorks: { title: 'How HMAC works', body: ['HMAC mixes a secret key into a hash so that only someone who knows the key can produce (or check) the result. It proves a message is authentic and unmodified.', 'It is commonly used to sign webhooks and API requests. Compare HMACs with a constant-time comparison in real code.'] },
    load: named(() => import('@/tools/hash/HashTools'), 'HmacGenerator') }),

  /* ───────── JSON ───────── */
  def({ id: 'json-string', name: 'String ⇄ JSON', description: 'Convert escaped strings to JSON and back', category: 'JSON', icon: Braces, popular: true,
    keywords: ['string to json online', 'convert string to json', 'json stringify online', 'json parse online', 'json escape', 'json unescape', 'stringified json to json', 'string to json', 'json to string', 'stringify', 'escape', 'unescape', 'json string', 'parse', 'serialize', 'escaped json'], seoTitle: 'String to JSON Converter Online — JSON Stringify & Parse', seoDescription: 'Convert an escaped string to JSON, or JSON to an escaped string, online. Unwraps double-encoded JSON. Runs locally in your browser.',
    howItWorks: { title: 'How string ⇄ JSON conversion works', body: ['APIs and logs often contain JSON stored inside a string, with quotes escaped like {\\"name\\":\\"John\\"}. String → JSON removes the escaping (even when it was applied more than once) and pretty-prints the result.', 'JSON → String does the reverse, like JSON.stringify applied to the JSON text, so you can embed it in another JSON value or in source code.'] },
    load: named(enc, 'JsonString') }),
  def({ id: 'json-formatter', name: 'JSON Formatter', description: 'Format, validate and minify JSON', category: 'JSON', icon: Braces, popular: true,
    keywords: ['json formatter online', 'json beautifier', 'json pretty print', 'json viewer', 'format json', 'json lint', 'json parser online', 'json', 'formatter', 'pretty print', 'minify', 'validator', 'beautify', 'lint'], seoTitle: 'JSON Formatter & Validator Online — Beautify and Minify JSON', seoDescription: 'Format, validate, minify and inspect JSON directly in your browser.',
    howItWorks: { title: 'How the JSON formatter works', body: ['The text is parsed with a strict JSON parser. If it is valid it is re-serialised with your chosen indentation (pretty print) or with no whitespace (minify).', 'When the JSON is invalid, DevCipher shows the line and column of the first problem — common causes are trailing commas, single quotes and unquoted keys.'] },
    load: named(() => import('@/tools/json/JsonTools'), 'JsonFormatter') }),
  def({ id: 'json-comparator', name: 'JSON Comparator', description: 'Find differences between two JSON documents', category: 'JSON', icon: GitCompare, popular: true,
    keywords: ['json compare online', 'json diff', 'compare two json', 'json difference', 'json comparator online', 'json diff checker', 'compare json files', 'json', 'compare', 'diff', 'difference', 'comparator', 'changes', 'side by side'], seoTitle: 'JSON Compare Online — Side-by-Side JSON Diff', seoDescription: 'Compare two JSON documents side by side and see added, removed and changed values. Free JSON diff tool that runs locally in your browser.',
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
    keywords: ['jwt decoder online', 'jwt debugger', 'jwt parser', 'decode jwt', 'jwt viewer', 'jwt verify online', 'jwt', 'json web token', 'decode', 'token', 'claims', 'bearer', 'verify', 'auth'],
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
    keywords: ['uuid generator online', 'guid generator', 'generate uuid', 'uuid v4 online', 'uuid v7', 'uuid', 'guid', 'v4', 'v7', 'random', 'unique', 'id'], seoTitle: 'UUID Generator Online — v4 & v7',
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


const alias = (baseId: string, o: Pick<ToolDefinition, 'id' | 'name' | 'description' | 'seoTitle' | 'seoDescription' | 'keywords'> & Partial<ToolDefinition>): ToolDefinition => {
  const base = CORE.find((t) => t.id === baseId)!
  return { ...base, ...o, path: `/tools/${o.id}`, hidden: true, popular: false }
}

/** Keyword landing pages: same engine, search-intent-specific title/description. Not shown in menus. */
const ALIASES: ToolDefinition[] = [
  alias('json-string', { id: 'string-to-json', name: 'String to JSON Converter', description: 'Convert an escaped or stringified string to JSON', seoTitle: 'String to JSON Converter Online — Parse Stringified JSON', seoDescription: 'Convert a string to JSON online: unescape and parse stringified JSON (even double-encoded) and pretty-print it instantly. Free and private — runs in your browser.', keywords: ['string to json', 'string to json online', 'convert string to json', 'stringified json to json', 'json parse online', 'unescape json', 'json string to object', 'escaped json'] }),
  alias('json-formatter', { id: 'json-validator', name: 'JSON Validator', description: 'Validate JSON and find syntax errors', seoTitle: 'JSON Validator Online — Check and Fix JSON Syntax', seoDescription: 'Validate JSON online. Paste your JSON to instantly see if it is valid, with the exact line and column of any error. Free and private.', keywords: ['json validator', 'json validator online', 'validate json', 'json lint', 'json syntax checker', 'check json', 'json error finder'] }),
  alias('json-formatter', { id: 'json-beautifier', name: 'JSON Beautifier', description: 'Beautify and pretty print JSON', seoTitle: 'JSON Beautifier Online — Pretty Print JSON', seoDescription: 'Beautify and pretty print JSON online with 2, 3, 4 or 8 spaces or tabs. Free JSON beautifier that runs locally in your browser.', keywords: ['json beautifier', 'json beautify', 'beautify json', 'json pretty print', 'json prettifier', 'json indent'] }),
  alias('json-comparator', { id: 'json-diff', name: 'JSON Diff', description: 'Side-by-side JSON diff checker', seoTitle: 'JSON Diff Online — Side-by-Side JSON Compare Tool', seoDescription: 'JSON diff checker: compare two JSON documents side by side and jump between added, removed and changed values. Free, private, no upload.', keywords: ['json diff', 'json diff online', 'json diff checker', 'json compare', 'compare json online', 'json difference tool', 'diff json'] }),
  alias('aes-encryption', { id: 'aes-decryption', name: 'AES Decryption', description: 'Decrypt AES-128/192/256 text online', seoTitle: 'AES Decryption Online — Decrypt AES-GCM, CBC, CTR', seoDescription: 'Decrypt AES-128, AES-192 and AES-256 (GCM, CBC, CTR) text online with your key and IV. Free and processed locally in your browser.', keywords: ['aes decryption', 'aes decrypt online', 'aes decrypt', 'decrypt aes 256', 'aes gcm decrypt', 'aes cbc decrypt'] }),
  alias('timestamp-converter', { id: 'unix-timestamp-converter', name: 'Unix Timestamp Converter', description: 'Epoch time to date and back', seoTitle: 'Unix Timestamp Converter — Epoch to Date and Back', seoDescription: 'Convert Unix timestamps (seconds or milliseconds) to human-readable dates and back. Free epoch converter running locally in your browser.', keywords: ['unix timestamp converter', 'epoch converter', 'epoch to date', 'timestamp to date', 'unix time', 'date to timestamp'] }),
  { ...CORE.find((t) => t.id === 'json-formatter')!, id: 'json-minifier', path: '/tools/json-minifier', name: 'JSON Minifier', description: 'Minify and compress JSON', hidden: true, popular: false, seoTitle: 'JSON Minifier Online — Compress and Minify JSON', seoDescription: 'Minify JSON online: remove whitespace and compress JSON to the smallest size. Free, instant and processed locally in your browser.', keywords: ['json minifier', 'json minify', 'minify json', 'compress json', 'json compressor', 'json one line'], component: lazy(named(() => import('@/tools/json/JsonTools'), 'JsonMinifier')) },
]

export const TOOLS: ToolDefinition[] = [...CORE, ...ALIASES]

export const toolById = (id: string) => TOOLS.find((t) => t.id === id)
export const toolsByCategory = (c: CategoryId) => TOOLS.filter((t) => t.category === c && !t.hidden)
export const visibleTools = () => TOOLS.filter((t) => !t.hidden)
export const popularTools = () => TOOLS.filter((t) => t.popular)

export const toolTitle = (t: ToolDefinition) => `${t.seoTitle ?? t.name} — DevCipher`
export const toolDescription = (t: ToolDefinition) => t.seoDescription ?? `${t.description} directly in your browser with DevCipher. Nothing is uploaded.`


/** Quick links shown in the top navigation. */
export const TOP_NAV_IDS = ['json-formatter', 'json-comparator', 'aes-encryption', 'url-encode-decode', 'base64-encode-decode', 'json-string']

/** Visible FAQ (also emitted as FAQPage structured data). */
export const toolFaq = (t: ToolDefinition): { q: string; a: string }[] => [
  { q: `What is ${t.name}?`, a: `${t.description}. ${t.howItWorks.body[0]}` },
  { q: `Is ${t.name} free to use?`, a: `Yes. ${t.name} on DevCipher is completely free, with no sign-up, no limits and no ads.` },
  { q: `Is my data safe when I use ${t.name}?`, a: 'Yes. Everything runs locally in your browser. Your input is never uploaded to a server, and sensitive values such as keys and tokens are never saved.' },
]
