import { useMemo, useRef, useState } from 'react'
import type { Trait } from '../types/trait'
import { FORMAT_LABELS } from '../types/trait'
import { BrapiError, fetchBrapiVariables } from '../utils/brapiImporter'

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

type Phase = 'input' | 'loading' | 'select'

interface Props {
  existingTraitNames: string[]
  onImport: (traits: Trait[]) => void
  onClose: () => void
}

export function BrapiModal({ existingTraitNames, onImport, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('input')
  const [serverUrl, setServerUrl] = useState('')
  const [fetchedTraits, setFetchedTraits] = useState<Trait[]>([])
  const [fetchProgress, setFetchProgress] = useState(0)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isCorsError, setIsCorsError] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  const existingLower = useMemo(
    () => new Set(existingTraitNames.map((n) => n.toLowerCase())),
    [existingTraitNames],
  )

  function isDupe(t: Trait): boolean {
    return existingLower.has(t.name.toLowerCase())
  }

  const filteredTraits = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return fetchedTraits
    return fetchedTraits.filter(
      (t) => t.name.toLowerCase().includes(q) || t.details?.toLowerCase().includes(q),
    )
  }, [fetchedTraits, search])

  const selectableInView = filteredTraits.filter((t) => !isDupe(t))
  const allInViewSelected =
    selectableInView.length > 0 && selectableInView.every((t) => selectedIds.has(t.id))

  const dupeCount = useMemo(() => fetchedTraits.filter(isDupe).length, [fetchedTraits, existingLower])

  async function handleConnect() {
    if (!serverUrl.trim()) return
    setPhase('loading')
    setFetchError(null)
    setIsCorsError(false)
    setFetchProgress(0)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const traits = await fetchBrapiVariables(serverUrl.trim(), controller.signal, (n) =>
        setFetchProgress(n),
      )
      setFetchedTraits(traits)
      setSelectedIds(new Set(traits.filter((t) => !isDupe(t)).map((t) => t.id)))
      setPhase('select')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setPhase('input')
        return
      }
      if (err instanceof BrapiError) {
        setFetchError(err.message)
        setIsCorsError(err.isCors)
      } else {
        setFetchError('Unexpected error. Check the URL and try again.')
        setIsCorsError(false)
      }
      setPhase('input')
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
  }

  function handleToggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allInViewSelected) {
        selectableInView.forEach((t) => next.delete(t.id))
      } else {
        selectableInView.forEach((t) => next.add(t.id))
      }
      return next
    })
  }

  function handleToggle(t: Trait) {
    if (isDupe(t)) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(t.id) ? next.delete(t.id) : next.add(t.id)
      return next
    })
  }

  function handleImport() {
    const toImport = fetchedTraits.filter((t) => selectedIds.has(t.id))
    if (toImport.length === 0) return
    onImport(toImport)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Import from BrAPI</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {phase === 'input' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the base URL of a BrAPI-compatible server (v1 or v2).
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Server URL</label>
                <input
                  type="url"
                  autoFocus
                  placeholder="https://example.org/brapi"
                  className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConnect()
                  }}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Example: https://cassavabase.org/brapi
                </p>
              </div>

              {fetchError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <p className="font-medium">{fetchError}</p>
                  {isCorsError && (
                    <p className="mt-1 text-xs text-red-500">
                      This may be a CORS restriction. The server must allow browser requests from
                      this origin. Contact your server administrator if the URL is correct.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">
                Fetching variables
                {fetchProgress > 0 ? ` (${fetchProgress} so far)` : '…'}
              </p>
            </div>
          )}

          {phase === 'select' && (
            <div>
              {/* Stats bar */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                  {fetchedTraits.length} variable{fetchedTraits.length !== 1 ? 's' : ''} found
                  {dupeCount > 0 && ` · ${dupeCount} already added`}
                </p>
                <button
                  onClick={() => {
                    setPhase('input')
                    setSearch('')
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ← Change server
                </button>
              </div>

              {/* Search */}
              <input
                type="search"
                placeholder="Filter by name…"
                className="mb-3 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* Select-all row */}
              <label className="flex items-center gap-2 mb-2 px-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allInViewSelected}
                  onChange={handleToggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                />
                <span className="text-xs text-gray-500">
                  {selectedIds.size} selected
                  {search && ` · showing ${filteredTraits.length} of ${fetchedTraits.length}`}
                </span>
              </label>

              {/* Trait rows */}
              <div className="space-y-1">
                {filteredTraits.map((trait) => {
                  const dupe = isDupe(trait)
                  const checked = selectedIds.has(trait.id)
                  const colorClass = FORMAT_COLORS[trait.format] ?? 'bg-gray-100 text-gray-700'

                  return (
                    <label
                      key={trait.id}
                      className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${
                        dupe
                          ? 'opacity-60 cursor-default border-gray-200 bg-white'
                          : `cursor-pointer ${checked ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={dupe}
                        checked={checked}
                        onChange={() => handleToggle(trait)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {trait.name}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${colorClass}`}
                          >
                            {FORMAT_LABELS[trait.format]}
                          </span>
                          {dupe && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 flex-shrink-0">
                              Already added
                            </span>
                          )}
                        </div>
                        {trait.details && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{trait.details}</p>
                        )}
                      </div>
                    </label>
                  )
                })}
                {filteredTraits.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No variables match your search.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0">
          {phase === 'loading' ? (
            <button
              onClick={handleCancel}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          ) : phase === 'input' ? (
            <>
              <button
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={!serverUrl.trim()}
                className="rounded bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={selectedIds.size === 0}
                className="rounded bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Import {selectedIds.size > 0 ? selectedIds.size : ''} Trait
                {selectedIds.size !== 1 ? 's' : ''}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
