import { useAuth } from '../context/AuthContext'
import { useSchedule } from '../context/ScheduleContext'
import { getTodayName, getTodayWorkout } from '../utils/dateUtils'

export default function WelcomeBanner() {
  const { user } = useAuth()
  const { activeView, myScheduleData, templateData } = useSchedule()

  const firstName = user?.name?.split(' ')[0] ?? ''
  const greeting = user?.isNew ? `Welcome, ${firstName}` : `Hi, ${firstName}`

  const today = getTodayName()
  let workoutLine = null

  if (activeView === 'template' && templateData) {
    const day = getTodayWorkout(templateData)
    if (day) {
      workoutLine = day.isRest
        ? `Today is ${today} — Rest Day (from ${templateData.name} template)`
        : `Today is ${today} — ${day.splitName} (from ${templateData.name} template)`
    }
  } else if (activeView === 'mySchedule' && myScheduleData) {
    const day = getTodayWorkout(myScheduleData)
    if (day) {
      workoutLine = day.isRest
        ? `Today is ${today} — Rest Day`
        : `Today is ${today} — ${day.splitName}`
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white">{greeting}</h2>
      {workoutLine && (
        <p className="text-gray-400 mt-1 text-sm">{workoutLine}</p>
      )}
    </div>
  )
}
