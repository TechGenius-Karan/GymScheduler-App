import { useEffect, useState } from 'react'
import { useSchedule } from '../context/ScheduleContext'
import { getSchedule, saveSchedule } from '../api/scheduleApi'
import WelcomeBanner from '../components/WelcomeBanner'
import SplitPicker from '../components/SplitPicker'
import TemplateView from '../components/TemplateView'
import WeeklyView from '../components/WeeklyView'
import ScheduleActionBar from '../components/ScheduleActionBar'

function ScheduleSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 bg-gray-800 rounded" />
            <div className="h-5 w-14 bg-gray-800 rounded-full" />
          </div>
          <div className="h-4 w-24 bg-gray-800 rounded" />
          <div className="flex flex-col gap-2 mt-1">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-3 bg-gray-800 rounded w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SchedulePage() {
  const { activeView, setActiveView, setMyScheduleData, myScheduleData } = useSchedule()
  const [scheduleLoading, setScheduleLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    getSchedule()
      .then(schedule => {
        if (schedule) {
          setMyScheduleData(schedule)
          setActiveView('mySchedule')
        } else {
          setActiveView('splitPicker')
        }
      })
      .catch(() => setActiveView('splitPicker'))
      .finally(() => setScheduleLoading(false))
  }, [])

  async function handleSave() {
    if (!myScheduleData?.days) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const saved = await saveSchedule(myScheduleData.days)
      setMyScheduleData(saved)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError('Failed to save. Your changes are still here — try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <WelcomeBanner />

      {scheduleLoading ? (
        <ScheduleSkeleton />
      ) : (
        <>
          {activeView === 'splitPicker' && <SplitPicker />}
          {activeView === 'template' && <TemplateView />}
          {activeView === 'mySchedule' && <WeeklyView />}
          <ScheduleActionBar onSave={handleSave} saving={saving} saveError={saveError} />
        </>
      )}

      {/* Fixed toast — doesn't shift layout */}
      {saveSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-gray-800 border border-green-500/40
                        text-green-400 text-sm rounded-xl shadow-xl z-50 whitespace-nowrap">
          Schedule saved successfully.
        </div>
      )}
    </main>
  )
}
