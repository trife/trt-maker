import type { TraitAttributes } from '../../types/trait'

interface Props {
  attrs: TraitAttributes
  onChange: (attrs: TraitAttributes) => void
}

export function PhotoFields({ attrs, onChange }: Props) {
  const set = (patch: Partial<TraitAttributes>) => onChange({ ...attrs, ...patch })
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="rounded text-green-600"
          checked={attrs.saveImage ?? true}
          onChange={(e) => set({ saveImage: e.target.checked })}
        />
        Save image to device
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="rounded text-green-600"
          checked={attrs.cropImage ?? false}
          onChange={(e) => set({ cropImage: e.target.checked })}
        />
        Allow image cropping
      </label>
    </div>
  )
}
