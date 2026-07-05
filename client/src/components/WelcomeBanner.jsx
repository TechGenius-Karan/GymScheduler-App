import { useAuth } from '../context/AuthContext'
import { useSchedule } from '../context/ScheduleContext'
import { getTodayName, getTodayWorkout } from '../utils/dateUtils'
import { getDayPhrase, getRestPhrase } from '../utils/dayPhrase'

function getTodayRestIndex(days, todayName) {
  let count = 0
  for (const day of days) {
    if (day.day === todayName) return count
    if (day.isRest) count++
  }
  return 0
}

export default function WelcomeBanner() {
  const { user } = useAuth()
  const { activeView, myScheduleData, templateData } = useSchedule()

  const firstName = user?.name?.split(' ')[0] ?? ''
  const greeting = user?.isNew ? `Welcome, ${firstName}` : `Hi, ${firstName}`

  const today = getTodayName()
  let workoutLine = null
  let todayPhrase = null

  if (activeView === 'template' && templateData) {
    const day = getTodayWorkout(templateData)
    if (day) {
      workoutLine = day.isRest
        ? `Today is ${today} — Rest Day (from ${templateData.name} template)`
        : `Today is ${today} — ${day.splitName} (from ${templateData.name} template)`
      todayPhrase = day.isRest
        ? getRestPhrase(getTodayRestIndex(templateData.days, today), firstName)
        : getDayPhrase(day.splitName, today)
    }
  } else if (activeView === 'mySchedule' && myScheduleData) {
    const day = getTodayWorkout(myScheduleData)
    if (day) {
      workoutLine = day.isRest
        ? `Today is ${today} — Rest Day`
        : `Today is ${today} — ${day.splitName}`
      todayPhrase = day.isRest
        ? getRestPhrase(getTodayRestIndex(myScheduleData.days, today), firstName)
        : getDayPhrase(day.splitName, today)
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white">{greeting}</h2>
      {workoutLine && (
        <p className="mt-1 text-base font-semibold text-cyan-400 tracking-wide">{workoutLine}</p>
      )}
      {todayPhrase && (
        <p className="mt-0.5 text-sm text-gray-500">{todayPhrase}</p>
      )}
    </div>
  )
}
