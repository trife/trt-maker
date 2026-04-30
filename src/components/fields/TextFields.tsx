import type { TraitAttributes } from '../../types/trait'

interface Props {
  attrs: TraitAttributes
  onChange: (attrs: TraitAttributes) => void
}

export function TextFields({ attrs, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        className="rounded text-green-600"
        checked={attrs.closeKeyboardOnOpen ?? false}
        onChange={(e) => onChange({ ...attrs, closeKeyboardOnOpen: e.target.checked })}
      />
      Auto-close keyboard after entry
    </label>
  )
}
