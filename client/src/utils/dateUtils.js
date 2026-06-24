const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function getTodayName() {
  return DAYS[new Date().getDay()]
}

export function getTodayWorkout(schedule) {
  if (!schedule?.days) return null
  const today = getTodayName()
  const day = schedule.days.find(d => d.day === today)
  if (!day) return null
  return {
    dayName: day.day,
    isRest: day.isRest,
    splitName: day.splitName,
    exerciseCount: day.exercises?.length ?? 0,
  }
}
