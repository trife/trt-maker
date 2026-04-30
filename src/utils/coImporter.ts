import * as XLSX from 'xlsx'
import type { Trait, FormatType, TraitAttributes } from '../types/trait'

let idCounter = 0
function nextId() {
  return `co-${++idCounter}`
}

function str(value: unknown): string {
  return String(value ?? '').trim()
}

function findCol(headers: unknown[], name: string): number {
  const lower = name.toLowerCase()
  return headers.findIndex((h) => typeof h === 'string' && h.trim().toLowerCase() === lower)
}

function mapFormat(scaleClass: string, hasCategories: boolean): FormatType {
  switch (scaleClass.toLowerCase()) {
    case 'numerical':
    case 'duration': return 'numeric'
    case 'ordinal':
    case 'nominal': return hasCategories ? 'categorical' : 'numeric'
    case 'date': return 'date'
    case 'text': return 'text'
    default: return 'text'
  }
}

// Supports two category column formats:
//   Old (v4): "Category 1", "Category 2", ... with combined "code= description" values
//   New (v5): "Cat 1 code" + "Cat 1 description" paired columns (up to Cat N)
function buildCategoryParser(headers: unknown[]): (row: unknown[]) => string[] {
  const newPairs = new Map<number, { codeIdx: number; descIdx: number }>()
  const oldCols = new Map<number, number>()

  headers.forEach((h, i) => {
    if (typeof h !== 'string') return
    const lower = h.trim().toLowerCase()

    const codeMatch = lower.match(/^cat\s+(\d+)\s+code$/)
    if (codeMatch) {
      const n = parseInt(codeMatch[1])
      const entry = newPairs.get(n) ?? { codeIdx: -1, descIdx: -1 }
      if (entry.codeIdx === -1) entry.codeIdx = i // first occurrence wins on duplicates
      newPairs.set(n, entry)
      return
    }
    const descMatch = lower.match(/^cat\s+(\d+)\s+description$/)
    if (descMatch) {
      const n = parseInt(descMatch[1])
      const entry = newPairs.get(n) ?? { codeIdx: -1, descIdx: -1 }
      if (entry.descIdx === -1) entry.descIdx = i
      newPairs.set(n, entry)
      return
    }
    const oldMatch = lower.match(/^category\s+(\d+)$/)
    if (oldMatch) {
      oldCols.set(parseInt(oldMatch[1]), i)
    }
  })

  if (newPairs.size > 0) {
    const sortedNums = [...newPairs.keys()].sort((a, b) => a - b)
    return (row) => {
      const cats: string[] = []
      for (const n of sortedNums) {
        const { codeIdx, descIdx } = newPairs.get(n)!
        const code = codeIdx !== -1 ? str(row[codeIdx]) : ''
        const desc = descIdx !== -1 ? str(row[descIdx]) : ''
        if (!code && !desc) continue
        cats.push(code && desc ? `${code}= ${desc}` : code || desc)
      }
      return cats
    }
  }

  if (oldCols.size > 0) {
    const sortedNums = [...oldCols.keys()].sort((a, b) => a - b)
    return (row) => {
      const cats: string[] = []
      for (const n of sortedNums) {
        const cat = str(row[oldCols.get(n)!])
        if (cat) cats.push(cat)
      }
      return cats
    }
  }

  return () => []
}

export function parseCO(buffer: ArrayBuffer): Trait[] {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const sheetName =
    wb.SheetNames.find((n) => n.trim().toLowerCase() === 'template for submission') ??
    wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][]

  if (rows.length < 2) return []

  const headers = rows[0]

  // Resolve column indices from header row — works across template versions
  const col = {
    variableName: findCol(headers, 'Variable name'),
    variableSynonyms: findCol(headers, 'Variable synonyms'),
    traitDescription: findCol(headers, 'Trait description'),
    mainAbbrev: findCol(headers, 'Main trait abbreviation'),
    scaleName: findCol(headers, 'Scale name'),
    scaleClass: findCol(headers, 'Scale class'),
    decimalPlaces: findCol(headers, 'Decimal places'),
    lowerLimit: findCol(headers, 'Lower limit'),
    upperLimit: findCol(headers, 'Upper limit'),
  }

  const getCategories = buildCategoryParser(headers)

  const traits: Trait[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const name = col.variableName !== -1 ? str(row[col.variableName]) : ''
    if (!name) continue

    const scaleClass = col.scaleClass !== -1 ? str(row[col.scaleClass]) : ''
    const rawCategories = getCategories(row)
    const format = mapFormat(scaleClass, rawCategories.length > 0)

    const attributes: TraitAttributes = {}

    if (format === 'numeric') {
      const lower = col.lowerLimit !== -1 ? str(row[col.lowerLimit]) : ''
      const upper = col.upperLimit !== -1 ? str(row[col.upperLimit]) : ''
      const scaleName = col.scaleName !== -1 ? str(row[col.scaleName]) : ''
      const decPlaces = col.decimalPlaces !== -1 ? row[col.decimalPlaces] : undefined

      if (lower) attributes.validValuesMin = lower
      if (upper) attributes.validValuesMax = upper
      if (scaleName) attributes.unit = scaleName
      if (decPlaces != null && decPlaces !== '') {
        attributes.decimalPlacesRequired = String(decPlaces)
      }
    } else if (format === 'categorical') {
      attributes.category = rawCategories.join('/')
    }

    const abbrev = col.mainAbbrev !== -1 ? str(row[col.mainAbbrev]) : ''
    const synonyms = abbrev ? [abbrev] : []
    const varSynonyms = col.variableSynonyms !== -1 ? str(row[col.variableSynonyms]) : ''
    if (varSynonyms) {
      varSynonyms.split(/[;,]+/).forEach((s) => {
        const t = s.trim()
        if (t && !synonyms.includes(t)) synonyms.push(t)
      })
    }

    const trait: Trait = {
      id: nextId(),
      name,
      alias: abbrev || undefined,
      synonyms: synonyms.length > 0 ? synonyms : undefined,
      format,
      defaultValue: '',
      details: col.traitDescription !== -1 ? str(row[col.traitDescription]) : '',
      isVisible: true,
    }

    if (Object.keys(attributes).length > 0) {
      trait.attributes = attributes
    }

    traits.push(trait)
  }

  return traits
}
