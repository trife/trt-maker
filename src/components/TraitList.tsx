import { useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import type { Trait } from '../types/trait'
import { TraitCard } from './TraitCard'

interface Props {
  traits: Trait[]
  selectedIds: Set<string>
  onReorder: (traits: Trait[]) => void
  onEdit: (trait: Trait) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onBulkDelete: () => void
}

export function TraitList({ traits, selectedIds, onReorder, onEdit, onDelete, onDuplicate, onToggleSelect, onSelectAll, onBulkDelete }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!selectAllRef.current) return
    selectAllRef.current.indeterminate = selectedIds.size > 0 && selectedIds.size < traits.length
  }, [selectedIds.size, traits.length])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = traits.findIndex((t) => t.id === active.id)
      const newIdx = traits.findIndex((t) => t.id === over.id)
      onReorder(arrayMove(traits, oldIdx, newIdx))
    }
  }

  if (traits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
        <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <p className="text-sm font-medium text-gray-500">No traits yet</p>
        <p className="text-xs text-gray-400 mt-1">Add a trait or load a .trt file to get started</p>
      </div>
    )
  }

  return (
    <div>
      {/* Selection header */}
      <div className="flex items-center gap-3 mb-1.5 px-3 py-1">
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={selectedIds.size === traits.length}
          onChange={onSelectAll}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 flex-shrink-0"
          aria-label="Select all traits"
        />
        <span className="text-xs text-gray-500 select-none">
          {selectedIds.size > 0 ? `${selectedIds.size} of ${traits.length} selected` : 'Select all'}
        </span>
        {selectedIds.size > 0 && (
          <button
            onClick={onBulkDelete}
            className="ml-auto text-xs font-medium text-red-600 hover:text-red-800 rounded px-2 py-0.5 hover:bg-red-50 transition-colors"
          >
            Delete {selectedIds.size} trait{selectedIds.size !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={traits.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {traits.map((trait, i) => (
              <TraitCard
                key={trait.id}
                trait={trait}
                index={i}
                isSelected={selectedIds.has(trait.id)}
                onEdit={() => onEdit(trait)}
                onDelete={() => onDelete(trait.id)}
                onDuplicate={() => onDuplicate(trait.id)}
                onToggleSelect={() => onToggleSelect(trait.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
