import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Trait } from '../types/trait'
import { FORMAT_LABELS } from '../types/trait'

const FORMAT_COLORS: Record<string, string> = {
  numeric: 'bg-blue-100 text-blue-800',
  percent: 'bg-cyan-100 text-cyan-800',
  text: 'bg-gray-100 text-gray-700',
  date: 'bg-purple-100 text-purple-800',
  boolean: 'bg-yellow-100 text-yellow-800',
  categorical: 'bg-orange-100 text-orange-800',
  counter: 'bg-teal-100 text-teal-800',
  photo: 'bg-pink-100 text-pink-800',
  audio: 'bg-rose-100 text-rose-800',
  location: 'bg-lime-100 text-lime-800',
  angle: 'bg-indigo-100 text-indigo-800',
  gnss: 'bg-emerald-100 text-emerald-800',
  stopwatch: 'bg-amber-100 text-amber-800',
  'disease rating': 'bg-red-100 text-red-800',
  'usb camera': 'bg-fuchsia-100 text-fuchsia-800',
  video: 'bg-violet-100 text-violet-800',
}

interface Props {
  trait: Trait
  index: number
  onEdit: () => void
  onDelete: () => void
}

export function TraitCard({ trait, index, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: trait.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const colorClass = FORMAT_COLORS[trait.format] ?? 'bg-gray-100 text-gray-700'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:border-gray-300 hover:shadow"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-300 hover:text-gray-500 flex-shrink-0"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
        </svg>
      </button>

      {/* Position */}
      <span className="w-6 text-right text-xs text-gray-400 flex-shrink-0">{index + 1}</span>

      {/* Format badge */}
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${colorClass}`}>
        {FORMAT_LABELS[trait.format]}
      </span>

      {/* Name + details */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{trait.name}</p>
        {trait.details && (
          <p className="truncate text-xs text-gray-500">{trait.details}</p>
        )}
      </div>

      {/* Visibility indicator */}
      {trait.isVisible === false && (
        <span className="text-xs text-gray-400 flex-shrink-0" title="Hidden">🚫</span>
      )}

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Edit"
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
