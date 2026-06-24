import { useSchedule } from '../context/ScheduleContext'

export default function ScheduleActionBar({ onSave, saving, saveError }) {
  const { activeView, setActiveView, copyToMySchedule, startFresh, myScheduleData } = useSchedule()

  if (activeView === 'splitPicker') return null

  if (activeView === 'template') {
    return (
      <div className="flex flex-wrap items-center gap-3 mt-6">
        <button
          onClick={copyToMySchedule}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition"
        >
          Copy to My Schedule
        </button>
        <button
          onClick={startFresh}
          className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition"
        >
          Start Fresh
        </button>
        {myScheduleData && (
          <button
            onClick={() => setActiveView('mySchedule')}
            className="px-5 py-2.5 text-gray-400 hover:text-white text-sm transition"
          >
            ← Back to my schedule
          </button>
        )}
      </div>
    )
  }

  if (activeView === 'mySchedule') {
    return (
      <div className="flex flex-wrap items-center gap-3 mt-6">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
        <button
          onClick={() => setActiveView('splitPicker')}
          className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition"
        >
          Change Split
        </button>
        {saveError && (
          <p className="text-red-400 text-sm">{saveError}</p>
        )}
      </div>
    )
  }

  return null
}
