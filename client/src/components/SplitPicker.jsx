import { useEffect, useState } from 'react'
import { getAllTemplates } from '../api/templateApi'
import { useSchedule } from '../context/ScheduleContext'

export default function SplitPicker() {
  const { selectTemplate, loadingTemplate, selectedTemplateId, startFresh } = useSchedule()
  const [templates, setTemplates] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAllTemplates()
      .then(setTemplates)
      .catch(() => setError('Failed to load templates'))
      .finally(() => setLoadingList(false))
  }, [])

  if (loadingList) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Choose a training split</h3>
        <p className="text-gray-400 text-sm">Pick a template to preview it, or start with a blank schedule.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => selectTemplate(t.id)}
            disabled={loadingTemplate}
            className={`text-left p-4 rounded-xl border transition ${
              selectedTemplateId === t.id
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750'
            } disabled:opacity-50`}
          >
            <p className="font-semibold text-white text-sm">{t.name}</p>
            <p className="text-gray-400 text-xs mt-1">{t.description}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-gray-600 text-xs">or</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      <button
        onClick={startFresh}
        className="w-full py-3 rounded-xl border border-gray-700 text-gray-300 text-sm hover:border-gray-500 hover:text-white transition"
      >
        Start with a blank schedule
      </button>
    </div>
  )
}
