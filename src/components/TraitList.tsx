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
  onReorder: (traits: Trait[]) => void
  onEdit: (trait: Trait) => void
  onDelete: (id: string) => void
}

export function TraitList({ traits, onReorder, onEdit, onDelete }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={traits.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {traits.map((trait, i) => (
            <TraitCard
              key={trait.id}
              trait={trait}
              index={i}
              onEdit={() => onEdit(trait)}
              onDelete={() => onDelete(trait.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
