import { useEffect, useState } from 'react'
import type { Trait, TraitAttributes, FormatType } from '../types/trait'
import { FORMAT_TYPES, FORMAT_LABELS } from '../types/trait'
import { NumericFields } from './fields/NumericFields'
import { CategoricalFields } from './fields/CategoricalFields'
import { DateFields } from './fields/DateFields'
import { TextFields } from './fields/TextFields'
import { PhotoFields } from './fields/PhotoFields'
import { UniversalFields } from './fields/UniversalFields'

interface Props {
  trait: Trait | null
  existingNames: string[]
  onSave: (trait: Omit<Trait, 'id'>) => void
  onClose: () => void
}

const BLANK: Omit<Trait, 'id'> = {
  name: '',
  format: 'numeric',
  details: '',
  defaultValue: '',
  alias: '',
  isVisible: true,
  attributes: {},
}

export function TraitFormModal({ trait, existingNames, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<Trait, 'id'>>(BLANK)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (trait) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...rest } = trait
      setForm({ ...BLANK, ...rest, attributes: { ...(rest.attributes ?? {}) } })
    } else {
      setForm({ ...BLANK, attributes: {} })
    }
    setNameError('')
  }, [trait])

  const set = (patch: Partial<Omit<Trait, 'id'>>) => setForm((f) => ({ ...f, ...patch }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) {
      setNameError('Name is required.')
      return
    }
    const isDuplicate = existingNames
      .filter((n) => n !== trait?.name)
      .some((n) => n.toLowerCase() === name.toLowerCase())
    if (isDuplicate) {
      setNameError('A trait with this name already exists.')
      return
    }
    onSave({ ...form, name })
  }

  function handleFormatChange(format: FormatType) {
    set({ format, attributes: {} })
  }

  const attrs = form.attributes ?? {}
  const setAttrs = (a: TraitAttributes) => set({ attributes: a })

  function formatSpecificFields() {
    switch (form.format) {
      case 'numeric':
      case 'percent':
        return <NumericFields attrs={attrs} onChange={setAttrs} />
      case 'categorical':
      case 'disease rating':
        return <CategoricalFields attrs={attrs} onChange={setAttrs} />
      case 'date':
        return <DateFields attrs={attrs} onChange={setAttrs} />
      case 'text':
        return <TextFields attrs={attrs} onChange={setAttrs} />
      case 'photo':
      case 'usb camera':
        return <PhotoFields attrs={attrs} onChange={setAttrs} />
      default:
        return null
    }
  }

  const specificFields = formatSpecificFields()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {trait ? 'Edit Trait' : 'Add Trait'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              className={`mt-1 block w-full rounded border px-2 py-1.5 text-sm shadow-sm focus:border-green-500 focus:ring-green-500 ${nameError ? 'border-red-400' : 'border-gray-300'}`}
              value={form.name}
              onChange={(e) => { set({ name: e.target.value }); setNameError('') }}
            />
            {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Format <span className="text-red-500">*</span>
            </label>
            <select
              className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
              value={form.format}
              onChange={(e) => handleFormatChange(e.target.value as FormatType)}
            >
              {FORMAT_TYPES.map((f) => (
                <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
              ))}
            </select>
          </div>

          {/* Details / Units */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Details / Units</label>
            <input
              type="text"
              className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="e.g. cm, description shown in app"
              value={form.details ?? ''}
              onChange={(e) => set({ details: e.target.value })}
            />
          </div>

          {/* Default Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Value</label>
            <input
              type="text"
              className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
              value={form.defaultValue ?? ''}
              onChange={(e) => set({ defaultValue: e.target.value })}
            />
          </div>

          {/* Alias */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Alias <span className="text-gray-400 font-normal">(optional display name)</span></label>
            <input
              type="text"
              className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Leave blank to use name"
              value={form.alias ?? ''}
              onChange={(e) => set({ alias: e.target.value })}
            />
          </div>

          {/* Visible toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="rounded text-green-600"
              checked={form.isVisible ?? true}
              onChange={(e) => set({ isVisible: e.target.checked })}
            />
            Visible in Field Book
          </label>

          {/* Format-specific fields */}
          {specificFields && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {FORMAT_LABELS[form.format]} options
              </p>
              {specificFields}
            </div>
          )}

          {/* Universal fields */}
          <UniversalFields attrs={attrs} onChange={setAttrs} />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {trait ? 'Save Changes' : 'Add Trait'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
