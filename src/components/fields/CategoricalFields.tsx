import { useState } from 'react'
import type { TraitAttributes } from '../../types/trait'

interface Props {
  attrs: TraitAttributes
  onChange: (attrs: TraitAttributes) => void
}

export function CategoricalFields({ attrs, onChange }: Props) {
  const set = (patch: Partial<TraitAttributes>) => onChange({ ...attrs, ...patch })

  const categories = attrs.category ? attrs.category.split('/').filter(Boolean) : []
  const [newCat, setNewCat] = useState('')

  function addCategory() {
    const val = newCat.trim()
    if (!val) return
    const updated = [...categories, val]
    set({ category: updated.join('/') })
    setNewCat('')
  }

  function removeCategory(idx: number) {
    const updated = categories.filter((_, i) => i !== idx)
    set({ category: updated.join('/') })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCategory()
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <span className="text-sm font-medium text-gray-700">Categories</span>
        <p className="text-xs text-gray-500">Stored slash-separated (e.g. Red/Green/Blue)</p>
        <div className="mt-2 flex flex-wrap gap-1 min-h-8">
          {categories.map((cat, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
            >
              {cat}
              <button
                type="button"
                onClick={() => removeCategory(i)}
                className="text-green-600 hover:text-green-900 ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            className="flex-1 rounded border-gray-300 border px-2 py-1.5 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
            placeholder="Add category…"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={addCategory}
            className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Add
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="rounded text-green-600"
            checked={attrs.allowMulticat ?? false}
            onChange={(e) => set({ allowMulticat: e.target.checked })}
          />
          Allow multiple selections
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="rounded text-green-600"
            checked={attrs.allowOther ?? false}
            onChange={(e) => set({ allowOther: e.target.checked })}
          />
          Allow custom "Other" value
        </label>
      </div>
    </div>
  )
}
