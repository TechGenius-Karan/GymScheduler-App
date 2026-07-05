import { useEffect, useRef, useState } from 'react'
import { useSchedule } from '../context/ScheduleContext'
import NewProgramModal from './NewProgramModal'

export default function ProgramBar() {
  const {
    programs, activeProgramId, hasUnsavedChanges,
    switchProgram, renameProgramById, deleteProgramById, saveActiveProgram,
  } = useSchedule()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const [switching, setSwitching] = useState(false)
const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [error, setError] = useState(null)

  const dropdownRef = useRef(null)
  const renameInputRef = useRef(null)

  const activeProgram = programs.find(p => p._id === activeProgramId)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (renamingId && renameInputRef.current) renameInputRef.current.focus()
  }, [renamingId])

  if (!programs.length) return null

  function handleSelect(id) {
    if (id === activeProgramId) { setDropdownOpen(false); return }
    if (hasUnsavedChanges) {
      setDropdownOpen(false)
      setPendingId(id)
    } else {
      doSwitch(id)
    }
  }

  async function doSwitch(id) {
    setSwitching(true)
    setError(null)
    try {
      await switchProgram(id)
    } catch {
      setError('Could not switch program.')
    } finally {
      setSwitching(false)
      setPendingId(null)
    }
  }

  async function handleSaveAndSwitch() {
    setSwitching(true)
    setError(null)
    try {
      await saveActiveProgram()
      await switchProgram(pendingId)
    } catch {
      setError('Could not save. Try again.')
    } finally {
      setSwitching(false)
      setPendingId(null)
    }
  }

  async function handleRenameConfirm(id) {
    const trimmed = renameValue.trim()
    setRenamingId(null)
    if (!trimmed) return
    try {
      await renameProgramById(id, trimmed)
    } catch {
      setError('Could not rename.')
    }
  }

  async function handleDelete(id) {
    setConfirmDeleteId(null)
    setDropdownOpen(false)
    try {
      await deleteProgramById(id)
    } catch {
      setError('Could not delete program.')
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 flex-wrap">

        {/* Program switcher dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(o => !o); setPendingId(null) }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700
                       hover:border-gray-600 text-white text-sm font-medium transition"
          >
            <span className="max-w-48 truncate">{activeProgram?.name ?? 'Select program'}</span>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20" fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-20 min-w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
              {programs.map(p => (
                <div key={p._id} className="relative group">
                  {renamingId === p._id ? (
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameConfirm(p._id)
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        onBlur={() => handleRenameConfirm(p._id)}
                        maxLength={40}
                        className="flex-1 bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-sm text-white outline-none"
                      />
                    </div>
                  ) : confirmDeleteId === p._id ? (
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-red-900/20">
                      <span className="text-red-400 text-xs truncate">Delete "{p.name}"?</span>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="text-red-400 hover:text-red-300 text-xs font-semibold"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSelect(p._id)}
                        className={`flex-1 text-left flex items-center gap-2.5 px-3 py-2.5 text-sm transition
                          ${p._id === activeProgramId
                            ? 'text-white bg-gray-800'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                      >
                        <span className={`w-3.5 flex-shrink-0 ${p._id === activeProgramId ? 'text-indigo-400' : 'text-transparent'}`}>
                          ✓
                        </span>
                        <span className="truncate">{p.name}</span>
                      </button>

                      {/* Inline actions */}
                      <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setRenamingId(p._id)
                            setRenameValue(p.name)
                            setConfirmDeleteId(null)
                          }}
                          title="Rename"
                          className="p-1.5 rounded text-gray-500 hover:text-gray-200 transition"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setConfirmDeleteId(p._id)
                          }}
                          title="Delete"
                          className="p-1.5 rounded text-gray-500 hover:text-red-400 transition"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New program button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400
                     hover:border-gray-600 hover:text-white text-sm transition"
        >
          <span>+</span>
          <span>New Program</span>
        </button>

        {switching && <span className="text-gray-500 text-sm">Switching...</span>}
        {error && <span className="text-red-400 text-sm">{error}</span>}
      </div>

      {/* Unsaved changes prompt */}
      {pendingId && (
        <div className="mt-2 flex flex-wrap items-center gap-2 p-2.5 bg-amber-900/20 border border-amber-700/40 rounded-lg text-sm">
          <span className="text-amber-400">Unsaved changes.</span>
          <button
            onClick={handleSaveAndSwitch}
            disabled={switching}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
          >
            Save & Switch
          </button>
          <button
            onClick={() => doSwitch(pendingId)}
            disabled={switching}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
          >
            Discard & Switch
          </button>
          <button
            onClick={() => setPendingId(null)}
            className="px-2 py-1 text-gray-400 hover:text-white text-xs transition"
          >
            Cancel
          </button>
        </div>
      )}

      {showModal && <NewProgramModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
