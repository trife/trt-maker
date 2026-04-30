import type { TraitAttributes } from '../../types/trait'

interface Props {
  attrs: TraitAttributes
  onChange: (attrs: TraitAttributes) => void
}

export function NumericFields({ attrs, onChange }: Props) {
  const set = (patch: Partial<TraitAttributes>) => onChange({ ...attrs, ...patch })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Minimum</span>
          <input
            type="number"
            className="mt-1 block w-full rounded border-gray-300 border px-2 py-1.5 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
            value={attrs.validValuesMin ?? ''}
            placeholder="No minimum"
            onChange={(e) => set({ validValuesMin: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Maximum</span>
          <input
            type="number"
            className="mt-1 block w-full rounded border-gray-300 border px-2 py-1.5 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
            value={attrs.validValuesMax ?? ''}
            placeholder="No maximum"
            onChange={(e) => set({ validValuesMax: e.target.value })}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Unit</span>
        <input
          type="text"
          className="mt-1 block w-full rounded border-gray-300 border px-2 py-1.5 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
          value={attrs.unit ?? ''}
          placeholder="e.g. cm, kg, mm"
          onChange={(e) => set({ unit: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Decimal places</span>
        <select
          className="mt-1 block w-full rounded border-gray-300 border px-2 py-1.5 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
          value={attrs.decimalPlacesRequired ?? '-1'}
          onChange={(e) => set({ decimalPlacesRequired: e.target.value })}
        >
          <option value="-1">Any</option>
          <option value="0">0 (integer)</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </label>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="rounded text-green-600"
            checked={attrs.allowInvalidValues ?? false}
            onChange={(e) => set({ allowInvalidValues: e.target.checked })}
          />
          Allow values outside min/max
        </label>
      </div>
    </div>
  )
}
