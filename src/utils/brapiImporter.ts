import type { FormatType, Trait, TraitAttributes } from '../types/trait'

export class BrapiError extends Error {
  constructor(
    message: string,
    public readonly isCors: boolean = false,
  ) {
    super(message)
    this.name = 'BrapiError'
  }
}

// Raw BrAPI wire shapes (v1 and v2 share the same structure at result.data level for most fields)
interface BrapiCategory {
  label?: string
  value?: string
}

interface BrapiScale {
  dataType?: string
  decimalPlaces?: number
  units?: string
  validValues?: {
    min?: number | string | null
    max?: number | string | null
    categories?: Array<BrapiCategory | string>
  }
  // v1 flat category array
  categories?: string[]
}

interface BrapiVariable {
  observationVariableDbId?: string
  observationVariableName?: string
  synonyms?: string[]
  trait?: {
    traitName?: string
    traitDescription?: string
    synonyms?: string[]
  }
  scale?: BrapiScale
  method?: {
    methodName?: string
    methodDescription?: string
  }
}

interface BrapiPagedBody {
  result?: {
    data?: unknown[]
    observationVariables?: unknown[]
  }
  metadata?: {
    pagination?: {
      currentPage?: number
      pageSize?: number
      totalPages?: number
    }
  }
}

let idCounter = 0

function nextId(): string {
  return `brapi-${++idCounter}`
}

function extractData(body: BrapiPagedBody): BrapiVariable[] {
  const data = body.result?.data ?? body.result?.observationVariables
  if (!Array.isArray(data)) throw new BrapiError('Server response did not contain a valid variable list.')
  return data as BrapiVariable[]
}

function extractCategories(scale: BrapiScale | undefined): string[] {
  if (!scale) return []

  // BrAPI v2: scale.validValues.categories (array of objects or strings)
  const v2cats = scale.validValues?.categories
  if (Array.isArray(v2cats) && v2cats.length > 0) {
    return v2cats.map((c) => {
      if (typeof c === 'string') return c
      return (c.label ?? c.value ?? '').trim()
    }).filter(Boolean)
  }

  // BrAPI v1: scale.categories (flat string array)
  if (Array.isArray(scale.categories) && scale.categories.length > 0) {
    return scale.categories.filter(Boolean)
  }

  return []
}

function mapBrapiFormat(dataType: string | undefined, hasCategories: boolean): FormatType {
  switch (dataType?.toLowerCase()) {
    case 'numerical':
    case 'numeric':
    case 'duration':
      return 'numeric'
    case 'ordinal':
    case 'nominal':
      return hasCategories ? 'categorical' : 'numeric'
    case 'date':
      return 'date'
    case 'text':
    case 'code':
      return 'text'
    default:
      return 'text'
  }
}

function convertVariable(v: BrapiVariable): Trait {
  const name = (v.observationVariableName ?? '').trim() || 'Unnamed Variable'
  const details = (v.trait?.traitDescription ?? v.method?.methodDescription ?? '').trim()

  const rawSynonyms = [
    ...(v.synonyms ?? []),
    ...(v.trait?.synonyms ?? []),
  ].map((s) => s.trim()).filter(Boolean)
  const synonyms = [...new Set(rawSynonyms)]

  const categories = extractCategories(v.scale)
  const format = mapBrapiFormat(v.scale?.dataType, categories.length > 0)

  const attributes: TraitAttributes = {}

  if (format === 'numeric') {
    const min = v.scale?.validValues?.min
    const max = v.scale?.validValues?.max
    if (min != null && min !== '') attributes.validValuesMin = String(min)
    if (max != null && max !== '') attributes.validValuesMax = String(max)
    if (v.scale?.units) attributes.unit = v.scale.units
    const dp = v.scale?.decimalPlaces
    if (typeof dp === 'number' && dp >= 0 && dp <= 4) {
      attributes.decimalPlacesRequired = String(dp)
    } else if (typeof dp === 'number') {
      attributes.decimalPlacesRequired = '-1'
    }
  }

  if (format === 'categorical' && categories.length > 0) {
    attributes.category = categories.join('/')
  }

  return {
    id: nextId(),
    name,
    format,
    defaultValue: '',
    isVisible: true,
    ...(details ? { details } : {}),
    ...(synonyms.length > 0 ? { synonyms } : {}),
    ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
  }
}

async function fetchPage(
  url: string,
  signal: AbortSignal,
): Promise<{ data: BrapiVariable[]; totalPages: number }> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    // Network-level failure is typically CORS or connectivity
    throw new BrapiError(
      'Could not connect to the server. Check the URL and your network connection.',
      true,
    )
  }

  if (!response.ok) {
    throw new BrapiError(`Server returned ${response.status} ${response.statusText}.`)
  }

  let body: BrapiPagedBody
  try {
    body = (await response.json()) as BrapiPagedBody
  } catch {
    throw new BrapiError('Server response was not valid JSON.')
  }

  const data = extractData(body)
  const totalPages = body.metadata?.pagination?.totalPages ?? 1

  return { data, totalPages }
}

async function fetchAllPages(
  baseUrl: string,
  path: string,
  signal: AbortSignal,
  onProgress?: (fetched: number) => void,
): Promise<BrapiVariable[]> {
  const allVars: BrapiVariable[] = []
  let page = 0
  let totalPages = 1

  do {
    const url = `${baseUrl}${path}?page=${page}&pageSize=1000`
    const result = await fetchPage(url, signal)

    if (result.data.length === 0) break

    allVars.push(...result.data)
    totalPages = result.totalPages
    onProgress?.(allVars.length)
    page++
  } while (page < totalPages)

  return allVars
}

export async function fetchBrapiVariables(
  serverUrl: string,
  signal: AbortSignal,
  onProgress?: (fetched: number) => void,
): Promise<Trait[]> {
  const base = serverUrl.replace(/\/+$/, '')

  // Try BrAPI v2 first with a lightweight probe (pageSize=1)
  let path: string
  try {
    const probeUrl = `${base}/brapi/v2/variables?page=0&pageSize=1`
    const { data } = await fetchPage(probeUrl, signal)
    // If we got here without error and data is an array, v2 works
    void data
    path = '/brapi/v2/variables'
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    if (err instanceof BrapiError && err.isCors) throw err

    // Fall back to v1
    try {
      const probeUrl = `${base}/brapi/v1/observationvariables?page=0&pageSize=1`
      const { data } = await fetchPage(probeUrl, signal)
      void data
      path = '/brapi/v1/observationvariables'
    } catch (v1err) {
      if (v1err instanceof DOMException && v1err.name === 'AbortError') throw v1err
      if (v1err instanceof BrapiError && v1err.isCors) throw v1err
      throw new BrapiError(
        'No BrAPI variables endpoint found at this server. Check the URL and try again.',
      )
    }
  }

  const variables = await fetchAllPages(base, path, signal, onProgress)

  if (variables.length === 0) {
    throw new BrapiError('The server returned no variables.')
  }

  return variables.map(convertVariable)
}
