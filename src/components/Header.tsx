import { useRef } from 'react'

interface Props {
  traitCount: number
  onLoad: (content: string, filename: string) => void
  onLoadCO: (file: File) => void
  onExport: () => void
  onNew: () => void
  onAddTrait: () => void
}

export function Header({ traitCount, onLoad, onLoadCO, onExport, onNew, onAddTrait }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const coFileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onLoad(reader.result as string, file.name)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleCOFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onLoadCO(file)
    e.target.value = ''
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 mr-auto">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white text-sm font-bold select-none">
          T
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">TRT Maker</h1>
          <p className="text-xs text-gray-500 leading-tight">Field Book trait editor</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onNew}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          title="Clear all traits and start fresh"
        >
          New
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Load .trt
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".trt,.csv,.json"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => coFileRef.current?.click()}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          title="Import traits from a Crop Ontology (CO) trait dictionary Excel file"
        >
          Import CO
        </button>
        <input
          ref={coFileRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleCOFileChange}
        />

        <button
          onClick={onExport}
          disabled={traitCount === 0}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Export .trt
        </button>

        <button
          onClick={onAddTrait}
          className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
        >
          + Add Trait
        </button>
      </div>
    </header>
  )
}
