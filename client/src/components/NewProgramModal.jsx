import { useEffect, useState } from 'react'
import { getAllTemplates, getTemplate } from '../api/templateApi'
import { useSchedule } from '../context/ScheduleContext'

const SOURCES = ['fresh', 'template', 'duplicate']
const SOURCE_LABELS = { fresh: 'Blank', template: 'Template', duplicate: 'Duplicate' }

export default function NewProgramModal({ onClose }) {
  const { createNewProgram, myScheduleData } = useSchedule()

  const [name, setName] = useState('')
  const [source, setSource] = useState('fresh')
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [selectedTemplateData, setSelectedTemplateData] = useState(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (source !== 'template') return
    setLoadingTemplates(true)
    getAllTemplates()
      .then(setTemplates)
      .catch(() => setError('Failed to load templates.'))
      .finally(() => setLoadingTemplates(false))
  }, [source])

  async function handleTemplateSelect(id) {
    setSelectedTemplateId(id)
    setLoadingTemplate(true)
    setError(null)
    try {
      const t = await getTemplate(id)
      setSelectedTemplateData(t)
    } catch {
      setError('Failed to load template.')
    } finally {
      setLoadingTemplate(false)
    }
  }

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      let days = null
      if (source === 'template') {
        if (!selectedTemplateData) return
        days = selectedTemplateData.days
      } else if (source === 'duplicate') {
        days = myScheduleData?.days ?? null
      }
      await createNewProgram(name.trim(), days)
      onClose()
    } catch {
      setError('Failed to create program. Try again.')
      setCreating(false)
    }
  }

  const canCreate =
    name.trim().length > 0 &&
    (source !== 'template' || selectedTemplateData) &&
    !creating

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">New Program</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Name input */}
        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-1.5">Program name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canCreate && handleCreate()}
            maxLength={40}
            placeholder="e.g. Bulk Phase, Cut Program, Strength Block..."
            className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-lg px-3 py-2.5
                       text-white text-sm outline-none transition placeholder:text-gray-600"
          />
        </div>

        {/* Source picker */}
        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-1.5">Start with</label>
          <div className="grid grid-cols-3 gap-2">
            {SOURCES.map(opt => (
              <button
                key={opt}
                onClick={() => {
                  setSource(opt)
                  setSelectedTemplateId(null)
                  setSelectedTemplateData(null)
                  setError(null)
                }}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                  source === opt
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                {SOURCE_LABELS[opt]}
              </button>
            ))}
          </div>
          {source === 'duplicate' && (
            <p className="text-gray-500 text-xs mt-2">Copies your current active program as the starting point.</p>
          )}
        </div>

        {/* Template list */}
        {source === 'template' && (
          <div className="mb-5">
            {loadingTemplates ? (
              <div className="flex flex-col gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSelect(t.id)}
                    disabled={loadingTemplate}
                    className={`text-left p-3 rounded-xl border text-sm transition disabled:opacity-50 ${
                      selectedTemplateId === t.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
