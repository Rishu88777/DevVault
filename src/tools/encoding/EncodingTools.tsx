import {
  base64Decode, base64Encode, base64UrlDecode, base64UrlEncode, binaryDecode, binaryEncode, bytesToBase64, hexDecode, hexEncode,
  htmlDecode, htmlEncode, unicodeDecode, unicodeEncode, urlDecode, urlEncode, type UnicodeStyle,
} from '@/lib/encoding'
import { jsonToString, stringToJson } from '@/lib/formatting/jsonString'
import { Panel } from '@/components/ui/panel'
import { TransformTool, type TransformSpec } from '../shared/TransformTool'

const make = (spec: TransformSpec) => () => <TransformTool spec={spec} />
const b = (o: Record<string, string | boolean>, k: string) => o[k] as boolean
const s = (o: Record<string, string | boolean>, k: string) => o[k] as string

const base64EncodeSpec: TransformSpec = {
  emptyHint: 'Type or paste text to encode — or choose a file.', errorTitle: 'Unable to encode', outputLabel: 'Base64', filename: 'encoded.txt',
  fileHandler: (bytes) => bytesToBase64(bytes),
  run: (i) => base64Encode(i),
}
export const Base64Encoder = make(base64EncodeSpec)
const base64DecodeSpec: TransformSpec = {
  emptyHint: 'Paste Base64 to decode it.', errorTitle: 'Invalid Base64', outputLabel: 'Decoded text', filename: 'decoded.txt', run: (i) => base64Decode(i),
}
export const Base64Decoder = make(base64DecodeSpec)
export const Base64UrlEncoder = make({
  emptyHint: 'Type or paste text to encode.', errorTitle: 'Unable to encode', outputLabel: 'Base64URL', filename: 'encoded.txt',
  options: [{ id: 'pad', type: 'checkbox', label: 'Keep "=" padding', default: false }],
  run: (i, o) => base64UrlEncode(i, b(o, 'pad')),
})
export const Base64UrlDecoder = make({
  emptyHint: 'Paste Base64URL to decode it.', errorTitle: 'Invalid Base64URL', outputLabel: 'Decoded text', filename: 'decoded.txt', run: (i) => base64UrlDecode(i),
})

const urlEncodeSpec: TransformSpec = {
  emptyHint: 'Type or paste text to percent-encode.', errorTitle: 'Unable to encode', outputLabel: 'Encoded', filename: 'encoded.txt',
  options: [{ id: 'mode', type: 'select', label: 'Mode', default: 'component', options: [
    { value: 'component', label: 'Component (encodeURIComponent)' }, { value: 'full', label: 'Full URL (encodeURI)' }, { value: 'form', label: 'Form (space → +)' }] }],
  run: (i, o) => urlEncode(i, s(o, 'mode') as 'component' | 'full' | 'form'),
}
export const UrlEncoder = make(urlEncodeSpec)
const urlDecodeSpec: TransformSpec = {
  emptyHint: 'Paste a percent-encoded string to decode it.', errorTitle: 'Unable to decode', outputLabel: 'Decoded', filename: 'decoded.txt',
  options: [{ id: 'plus', type: 'checkbox', label: 'Treat + as space (form data)', default: false }],
  run: (i, o) => urlDecode(i, b(o, 'plus')),
}
export const UrlDecoder = make(urlDecodeSpec)

export const HexEncoder = make({
  emptyHint: 'Type or paste text to convert to hex.', errorTitle: 'Unable to encode', outputLabel: 'Hex', filename: 'hex.txt',
  options: [
    { id: 'sep', type: 'select', label: 'Separator', default: ' ', options: [{ value: ' ', label: 'Space' }, { value: '', label: 'None' }, { value: ',', label: 'Comma' }, { value: ':', label: 'Colon' }] },
    { id: 'upper', type: 'checkbox', label: 'Uppercase', default: false }, { id: 'prefix', type: 'checkbox', label: '0x prefix', default: false },
  ],
  run: (i, o) => hexEncode(i, { separator: s(o, 'sep'), upper: b(o, 'upper'), prefix: b(o, 'prefix') }),
})
export const HexDecoder = make({
  emptyHint: 'Paste hex bytes to decode them.', errorTitle: 'Invalid hex', outputLabel: 'Decoded text', filename: 'decoded.txt', run: (i) => hexDecode(i),
})

export const BinaryEncoder = make({
  emptyHint: 'Type or paste text to convert to binary.', errorTitle: 'Unable to encode', outputLabel: 'Binary', filename: 'binary.txt',
  options: [{ id: 'sep', type: 'select', label: 'Separator', default: ' ', options: [{ value: ' ', label: 'Space' }, { value: '', label: 'None' }] }],
  run: (i, o) => binaryEncode(i, s(o, 'sep')),
})
export const BinaryDecoder = make({
  emptyHint: 'Paste 8-bit binary to decode it.', errorTitle: 'Invalid binary', outputLabel: 'Decoded text', filename: 'decoded.txt', run: (i) => binaryDecode(i),
})

export const UnicodeEncoder = make({
  emptyHint: 'Type or paste text to escape.', errorTitle: 'Unable to encode', outputLabel: 'Escaped', filename: 'unicode.txt',
  options: [
    { id: 'style', type: 'select', label: 'Style', default: 'u4', options: [{ value: 'u4', label: '\\uXXXX (UTF-16)' }, { value: 'braces', label: '\\u{X} (code point)' }, { value: 'uplus', label: 'U+XXXX' }] },
    { id: 'ascii', type: 'checkbox', label: 'Only escape non-ASCII', default: false },
  ],
  run: (i, o) => unicodeEncode(i, s(o, 'style') as UnicodeStyle, b(o, 'ascii')),
})
export const UnicodeDecoder = make({
  emptyHint: 'Paste text containing \\uXXXX escapes.', errorTitle: 'Unable to decode', outputLabel: 'Decoded text', filename: 'decoded.txt', run: (i) => unicodeDecode(i),
})

export const HtmlEntityEncoder = make({
  emptyHint: 'Type or paste HTML or text to escape.', errorTitle: 'Unable to encode', outputLabel: 'Escaped', filename: 'escaped.html',
  options: [{ id: 'non', type: 'checkbox', label: 'Also encode non-ASCII characters', default: false }],
  run: (i, o) => htmlEncode(i, b(o, 'non')),
})
export const HtmlEntityDecoder = make({
  emptyHint: 'Paste text containing entities such as &amp; or &#65;.', errorTitle: 'Unable to decode', outputLabel: 'Decoded', filename: 'decoded.txt', run: (i) => htmlDecode(i),
})

/** Side-by-side Encode | Decode, like the classic single-page encoder tools. */
const dual = (enc: TransformSpec, dec: TransformSpec) => () => (
  <div className="grid gap-6 lg:grid-cols-2">
    <Panel title="Encode" category="Encoding"><TransformTool spec={enc} /></Panel>
    <Panel title="Decode" category="Encoding"><TransformTool spec={dec} /></Panel>
  </div>
)
export const UrlEncodeDecode = dual(urlEncodeSpec, urlDecodeSpec)
export const Base64EncodeDecode = dual(base64EncodeSpec, base64DecodeSpec)

const toStringSpec: TransformSpec = {
  inputLabel: 'JSON', outputLabel: 'String', emptyHint: 'Paste JSON to turn it into an escaped string.', errorTitle: 'Invalid JSON', filename: 'string.txt',
  options: [{ id: 'min', type: 'checkbox', label: 'Minify first', default: true }], run: (i, o) => jsonToString(i, b(o, 'min')),
}
const toJsonSpec: TransformSpec = {
  inputLabel: 'String', outputLabel: 'JSON', emptyHint: 'Paste an escaped / stringified JSON string.', errorTitle: 'Unable to convert', filename: 'result.json',
  options: [{ id: 'indent', type: 'select', label: 'Indentation', default: '2', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }] }],
  run: (i, o) => stringToJson(i, Number(s(o, 'indent'))),
}
export const JsonString = () => (
  <div className="grid gap-6 lg:grid-cols-2">
    <Panel title="String → JSON" category="JSON"><TransformTool spec={toJsonSpec} /></Panel>
    <Panel title="JSON → String" category="JSON"><TransformTool spec={toStringSpec} /></Panel>
  </div>
)
