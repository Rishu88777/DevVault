import { collectObjects, camel, inferType, pascal, snake, type TypeNode } from './types'

type Obj = Extract<TypeNode, { kind: 'object' }>
export interface CodeGenerator {
  id: string
  label: string
  language: string
  extension: string
  generate: (root: TypeNode) => string
}

const each = (root: TypeNode, fn: (o: Obj) => string, sep = '\n\n') => {
  const objs = collectObjects(root)
  return (objs.length ? objs.map(fn) : []).join(sep)
}
const wrapRoot = (root: TypeNode): TypeNode => (root.kind === 'object' ? root : { kind: 'object', name: 'Root', fields: [{ key: 'value', type: root, optional: false }] })

const ts = (t: TypeNode): string => t.kind === 'array' ? (t.item.kind === 'object' ? `${t.item.name}[]` : `${ts(t.item)}[]`) : t.kind === 'object' ? t.name : ({ string: 'string', int: 'number', float: 'number', bool: 'boolean', null: 'null', any: 'unknown' } as const)[t.kind]
const typescript: CodeGenerator = {
  id: 'typescript', label: 'TypeScript', language: 'typescript', extension: 'ts',
  generate: (r) => each(wrapRoot(r), (o) => `export interface ${o.name} {\n${o.fields.map((f) => `  ${/^[A-Za-z_$][\w$]*$/.test(f.key) ? f.key : JSON.stringify(f.key)}${f.optional ? '?' : ''}: ${ts(f.type)};`).join('\n')}\n}`),
}

const js = (t: TypeNode): string => t.kind === 'array' ? `Array<${js(t.item)}>` : t.kind === 'object' ? t.name : ({ string: 'string', int: 'number', float: 'number', bool: 'boolean', null: 'null', any: '*' } as const)[t.kind]
const javascript: CodeGenerator = {
  id: 'javascript', label: 'JavaScript (JSDoc)', language: 'javascript', extension: 'js',
  generate: (r) => each(wrapRoot(r), (o) => `/**\n * @typedef {Object} ${o.name}\n${o.fields.map((f) => ` * @property {${js(f.type)}} ${f.optional ? `[${f.key}]` : f.key}`).join('\n')}\n */`),
}

const py = (t: TypeNode): string => t.kind === 'array' ? `list[${py(t.item)}]` : t.kind === 'object' ? t.name : ({ string: 'str', int: 'int', float: 'float', bool: 'bool', null: 'None', any: 'Any' } as const)[t.kind]
const python: CodeGenerator = {
  id: 'python', label: 'Python (dataclasses)', language: 'python', extension: 'py',
  generate: (r) => `from __future__ import annotations\nfrom dataclasses import dataclass\nfrom typing import Any, Optional\n\n\n${each(wrapRoot(r), (o) => `@dataclass\nclass ${o.name}:\n${o.fields.length ? o.fields.map((f) => `    ${snake(f.key)}: ${f.optional ? `Optional[${py(f.type)}]` : py(f.type)}`).join('\n') : '    pass'}`, '\n\n\n')}`,
}

const go = (t: TypeNode): string => t.kind === 'array' ? `[]${go(t.item)}` : t.kind === 'object' ? t.name : ({ string: 'string', int: 'int64', float: 'float64', bool: 'bool', null: 'interface{}', any: 'interface{}' } as const)[t.kind]
const golang: CodeGenerator = {
  id: 'go', label: 'Go', language: 'go', extension: 'go',
  generate: (r) => each(wrapRoot(r), (o) => `type ${o.name} struct {\n${o.fields.map((f) => `\t${pascal(f.key)} ${f.optional && f.type.kind !== 'array' ? '*' : ''}${go(f.type)} \`json:"${f.key}${f.optional ? ',omitempty' : ''}"\``).join('\n')}\n}`),
}

const java_ = (t: TypeNode): string => t.kind === 'array' ? `List<${java_(t.item)}>` : t.kind === 'object' ? t.name : ({ string: 'String', int: 'Long', float: 'Double', bool: 'Boolean', null: 'Object', any: 'Object' } as const)[t.kind]
const java: CodeGenerator = {
  id: 'java', label: 'Java', language: 'java', extension: 'java',
  generate: (r) => `import java.util.List;\n\n${each(wrapRoot(r), (o) => {
    const fields = o.fields.map((f) => `    private ${java_(f.type)} ${camel(f.key)};`).join('\n')
    const acc = o.fields.map((f) => `    public ${java_(f.type)} get${pascal(f.key)}() { return ${camel(f.key)}; }\n    public void set${pascal(f.key)}(${java_(f.type)} ${camel(f.key)}) { this.${camel(f.key)} = ${camel(f.key)}; }`).join('\n\n')
    return `public class ${o.name} {\n${fields}\n\n${acc}\n}`
  })}`,
}

const cs = (t: TypeNode): string => t.kind === 'array' ? `List<${cs(t.item)}>` : t.kind === 'object' ? t.name : ({ string: 'string', int: 'long', float: 'double', bool: 'bool', null: 'object', any: 'object' } as const)[t.kind]
const csharp: CodeGenerator = {
  id: 'csharp', label: 'C#', language: 'csharp', extension: 'cs',
  generate: (r) => `using System.Collections.Generic;\nusing System.Text.Json.Serialization;\n\n${each(wrapRoot(r), (o) => `public class ${o.name}\n{\n${o.fields.map((f) => `    [JsonPropertyName("${f.key}")]\n    public ${cs(f.type)}${f.optional && !['string', 'array', 'object'].includes(f.type.kind) ? '?' : ''} ${pascal(f.key)} { get; set; }`).join('\n\n')}\n}`)}`,
}

/** Register new languages here — nothing else needs to change. */
export const CODE_GENERATORS: CodeGenerator[] = [typescript, javascript, python, golang, java, csharp]

export function generateCode(json: unknown, generatorId: string, rootName = 'Root'): string {
  const g = CODE_GENERATORS.find((x) => x.id === generatorId)
  if (!g) throw new Error(`No generator for ${generatorId}`)
  return g.generate(inferType(json, pascal(rootName) || 'Root'))
}
