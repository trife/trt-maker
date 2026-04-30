import type { TraitAttributes } from '../../types/trait'

interface Props {
  attrs: TraitAttributes
  onChange: (attrs: TraitAttributes) => void
}

export function UniversalFields({ attrs, onChange }: Props) {
  const set = (patch: Partial<TraitAttributes>) => onChange({ ...attrs, ...patch })
  return (
    <div className="border-t pt-3 mt-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">General options</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="rounded text-green-600" checked={attrs.repeatedMeasure ?? false} onChange={(e) => set({ repeatedMeasure: e.target.checked })} />
          Repeated measure
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="rounded text-green-600" checked={attrs.autoSwitchPlot ?? false} onChange={(e) => set({ autoSwitchPlot: e.target.checked })} />
          Auto-advance plot
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="rounded text-green-600" checked={attrs.attachPhoto ?? false} onChange={(e) => set({ attachPhoto: e.target.checked })} />
          Attach photo
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="rounded text-green-600" checked={attrs.attachAudio ?? false} onChange={(e) => set({ attachAudio: e.target.checked })} />
          Attach audio
        </label>
      </div>
    </div>
  )
}
