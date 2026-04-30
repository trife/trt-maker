import type { Trait, TraitJson, TraitAttributes } from '../types/trait'

const ATTR_DEFAULTS: TraitAttributes = {
  validValuesMin: '',
  validValuesMax: '',
  unit: '',
  decimalPlacesRequired: '-1',
  mathSymbolsEnabled: true,
  allowInvalidValues: false,
  category: '',
  allowMulticat: false,
  allowOther: false,
  categoryDisplayValue: false,
  closeKeyboardOnOpen: false,
  useDayOfYear: false,
  cropImage: false,
  saveImage: true,
  repeatedMeasure: false,
  autoSwitchPlot: false,
  attachPhoto: false,
  attachVideo: false,
  attachAudio: false,
  resourceFile: '',
}

function cleanAttributes(attrs: TraitAttributes | undefined): TraitAttributes | undefined {
  if (!attrs) return undefined
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(attrs)) {
    const k = key as keyof TraitAttributes
    if (value !== ATTR_DEFAULTS[k]) {
      cleaned[key] = value
    }
  }
  return Object.keys(cleaned).length > 0 ? (cleaned as TraitAttributes) : undefined
}

export function exportTraits(traits: Trait[]): string {
  const output: { traits: TraitJson[] } = {
    traits: traits.map((t, i) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...rest } = t
      const json: TraitJson = {
        ...rest,
        alias: rest.alias || rest.name,
        synonyms: rest.synonyms?.length ? rest.synonyms : [rest.name],
        defaultValue: rest.defaultValue ?? '',
        details: rest.details ?? '',
        isVisible: rest.isVisible ?? true,
        realPosition: i + 1,
        attributes: cleanAttributes(rest.attributes),
      }
      if (!json.attributes) delete json.attributes
      return json
    }),
  }
  return JSON.stringify(output, null, 2)
}

export function downloadTrt(traits: Trait[], filename = 'traits.trt'): void {
  const content = exportTraits(traits)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
