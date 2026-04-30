import type { TraitAttributes } from '../../types/trait'

interface Props {
  attrs: TraitAttributes
  onChange: (attrs: TraitAttributes) => void
}

export function DateFields({ attrs, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        className="rounded text-green-600"
        checked={attrs.useDayOfYear ?? false}
        onChange={(e) => onChange({ ...attrs, useDayOfYear: e.target.checked })}
      />
      Use day-of-year (1–365) instead of calendar date
    </label>
  )
}
