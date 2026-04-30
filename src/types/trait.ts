export const FORMAT_TYPES = [
  'numeric',
  'percent',
  'text',
  'date',
  'boolean',
  'categorical',
  'counter',
  'photo',
  'audio',
  'location',
  'angle',
  'gnss',
  'stopwatch',
  'disease rating',
  'usb camera',
  'video',
] as const

export type FormatType = (typeof FORMAT_TYPES)[number]

export const FORMAT_LABELS: Record<FormatType, string> = {
  numeric: 'Numeric',
  percent: 'Percent',
  text: 'Text',
  date: 'Date',
  boolean: 'Boolean',
  categorical: 'Categorical',
  counter: 'Counter',
  photo: 'Photo',
  audio: 'Audio',
  location: 'Location',
  angle: 'Angle',
  gnss: 'GNSS',
  stopwatch: 'Stopwatch',
  'disease rating': 'Disease Rating',
  'usb camera': 'USB Camera',
  video: 'Video',
}

export interface TraitAttributes {
  // numeric / percent
  validValuesMin?: string
  validValuesMax?: string
  unit?: string
  decimalPlacesRequired?: string
  mathSymbolsEnabled?: boolean
  allowInvalidValues?: boolean
  // categorical
  category?: string
  allowMulticat?: boolean
  allowOther?: boolean
  categoryDisplayValue?: boolean
  // text
  closeKeyboardOnOpen?: boolean
  // date
  useDayOfYear?: boolean
  // photo
  cropImage?: boolean
  saveImage?: boolean
  // universal
  repeatedMeasure?: boolean
  autoSwitchPlot?: boolean
  attachPhoto?: boolean
  attachVideo?: boolean
  attachAudio?: boolean
  resourceFile?: string
}

export interface TraitJson {
  name: string
  alias?: string
  synonyms?: string[]
  format: FormatType
  defaultValue?: string
  details?: string
  isVisible?: boolean
  realPosition?: number
  attributes?: TraitAttributes
}

// Internal app representation — adds a stable client-side id for React keys / dnd
export interface Trait extends TraitJson {
  id: string
}
