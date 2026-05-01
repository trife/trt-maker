import { useState } from 'react'
import type { Trait } from './types/trait'
import { Header } from './components/Header'
import { TraitList } from './components/TraitList'
import { TraitFormModal } from './components/TraitFormModal'
import { parseTrt } from './utils/trtParser'
import { downloadTrt } from './utils/trtExporter'
import { parseCO } from './utils/coImporter'

let idSeq = 0
function newId() {
  return `t-${++idSeq}`
}

export function App() {
  const [traits, setTraits] = useState<Trait[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTrait, setEditingTrait] = useState<Trait | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleLoad(content: string, filename: string) {
    try {
      const loaded = parseTrt(content)
      if (loaded.length === 0) {
        showToast('No valid traits found in file.')
        return
      }
      if (
        traits.length > 0 &&
        !window.confirm(`Replace the current ${traits.length} trait(s) with the ${loaded.length} trait(s) from "${filename}"?`)
      ) {
        return
      }
      setTraits(loaded)
      setSelectedIds(new Set())
      showToast(`Loaded ${loaded.length} trait(s) from ${filename}`)
    } catch {
      showToast('Failed to parse file. Make sure it is a valid .trt (JSON or CSV) file.')
    }
  }

  function handleLoadCO(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const loaded = parseCO(reader.result as ArrayBuffer)
        if (loaded.length === 0) {
          showToast('No valid traits found in CO file.')
          return
        }
        if (
          traits.length > 0 &&
          !window.confirm(
            `Replace the current ${traits.length} trait(s) with the ${loaded.length} trait(s) from "${file.name}"?`,
          )
        ) {
          return
        }
        setTraits(loaded)
        setSelectedIds(new Set())
        showToast(`Imported ${loaded.length} trait(s) from ${file.name}`)
      } catch {
        showToast('Failed to parse CO file. Make sure it is a valid Crop Ontology Excel file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleNew() {
    if (traits.length === 0) return
    if (!window.confirm('Clear all traits and start fresh?')) return
    setTraits([])
    setSelectedIds(new Set())
  }

  function handleAddTrait() {
    setEditingTrait(null)
    setModalOpen(true)
  }

  function handleEdit(trait: Trait) {
    setEditingTrait(trait)
    setModalOpen(true)
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    if (selectedIds.size === traits.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(traits.map((t) => t.id)))
    }
  }

  function handleDuplicate(id: string) {
    const trait = traits.find((t) => t.id === id)
    if (!trait) return
    const existingNames = traits.map((t) => t.name)
    const base = trait.name.replace(/ \(\d+\)$/, '')
    let candidate = ''
    for (let i = 1; ; i++) {
      candidate = `${base} (${i})`
      if (!existingNames.includes(candidate)) break
    }
    const duplicate: Trait = { ...trait, id: newId(), name: candidate }
    setTraits((prev) => {
      const idx = prev.findIndex((t) => t.id === id)
      const next = [...prev]
      next.splice(idx + 1, 0, duplicate)
      return next
    })
  }

  function handleDelete(id: string) {
    const trait = traits.find((t) => t.id === id)
    if (!trait) return
    if (!window.confirm(`Delete trait "${trait.name}"?`)) return
    setTraits((prev) => prev.filter((t) => t.id !== id))
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Delete ${selectedIds.size} selected trait${selectedIds.size !== 1 ? 's' : ''}?`)) return
    setTraits((prev) => prev.filter((t) => !selectedIds.has(t.id)))
    setSelectedIds(new Set())
  }

  function handleSave(data: Omit<Trait, 'id'>) {
    if (editingTrait) {
      setTraits((prev) =>
        prev.map((t) => (t.id === editingTrait.id ? { ...data, id: t.id } : t)),
      )
    } else {
      setTraits((prev) => [...prev, { ...data, id: newId() }])
    }
    setModalOpen(false)
    setEditingTrait(null)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingTrait(null)
  }

  const existingNames = traits.map((t) => t.name)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        traitCount={traits.length}
        onLoad={handleLoad}
        onLoadCO={handleLoadCO}
        onExport={() => downloadTrt(traits)}
        onNew={handleNew}
        onAddTrait={handleAddTrait}
      />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500">
            {traits.length === 0 ? 'Traits' : `${traits.length} trait${traits.length !== 1 ? 's' : ''}`}
          </h2>
          {traits.length > 0 && (
            <p className="text-xs text-gray-400">Drag rows to reorder</p>
          )}
        </div>

        <TraitList
          traits={traits}
          selectedIds={selectedIds}
          onReorder={setTraits}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onBulkDelete={handleBulkDelete}
        />
      </main>

      {modalOpen && (
        <TraitFormModal
          trait={editingTrait}
          existingNames={existingNames}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
