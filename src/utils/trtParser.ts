import type { Trait, TraitJson, FormatType } from '../types/trait'
import { FORMAT_TYPES } from '../types/trait'

let idCounter = 0
function nextId(): string {
  return `trait-${++idCounter}`
}

function toTrait(json: TraitJson): Trait {
  return { ...json, id: nextId() }
}

function isValidFormat(f: string): f is FormatType {
  return (FORMAT_TYPES as readonly string[]).includes(f)
}

export function parseTrt(content: string): Trait[] {
  const trimmed = content.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseJson(trimmed)
  }
  return parseCsv(trimmed)
}

function parseJson(content: string): Trait[] {
  const parsed = JSON.parse(content)
  const list: TraitJson[] = Array.isArray(parsed)
    ? parsed
    : (parsed.traits ?? [])
  return list
    .filter((t): t is TraitJson => !!t.name && isValidFormat(t.format))
    .map(toTrait)
}

function parseCsv(content: string): Trait[] {
  const lines = content.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)

  const traits: Trait[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const format = (cells[col('format')] ?? '').trim().toLowerCase()
    const name = (cells[col('trait')] ?? '').trim()
    if (!name) continue

    // legacy CSV: multicat → categorical with allowMulticat
    const resolvedFormat: string = format === 'multicat' ? 'categorical' : format
    if (!isValidFormat(resolvedFormat)) continue

    const trait: Trait = {
      id: nextId(),
      name,
      format: resolvedFormat,
      defaultValue: cells[col('defaultvalue')] ?? '',
      details: cells[col('details')] ?? '',
      isVisible: (cells[col('isvisible')] ?? 'true').toLowerCase() !== 'false',
      realPosition: parseInt(cells[col('realposition')] ?? '0', 10) || 0,
    }

    const attributes: Record<string, unknown> = {}
    const min = cells[col('minimum')] ?? ''
    const max = cells[col('maximum')] ?? ''
    const categories = cells[col('categories')] ?? ''

    if (min) attributes.validValuesMin = min
    if (max) attributes.validValuesMax = max
    if (categories) attributes.category = categories
    if (format === 'multicat') attributes.allowMulticat = true

    if (Object.keys(attributes).length > 0) {
      trait.attributes = attributes
    }

    traits.push(trait)
  }
  return traits
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}
