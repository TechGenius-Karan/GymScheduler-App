import { useSchedule } from '../context/ScheduleContext'
import { getTodayName } from '../utils/dateUtils'
import DayCard from './DayCard'

export default function WeeklyView() {
  const { myScheduleData } = useSchedule()
  const today = getTodayName()

  if (!myScheduleData?.days) return null

  let restCount = 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {myScheduleData.days.map(day => {
        const restIndex = day.isRest ? restCount++ : -1
        return <DayCard key={day.day} day={day} isToday={day.day === today} restIndex={restIndex} />
      })}
    </div>
  )
}
