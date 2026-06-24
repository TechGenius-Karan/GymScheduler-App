import { useSchedule } from '../context/ScheduleContext'
import ExerciseRow from './ExerciseRow'

export default function DayCard({ day, isToday }) {
  const { updateDay, addExercise } = useSchedule()

  const baseCard = `rounded-xl p-4 flex flex-col gap-3 border transition-colors ${
    isToday
      ? 'bg-gray-900 border-indigo-500/50 ring-1 ring-indigo-500/20'
      : 'bg-gray-900 border-gray-800'
  }`

  if (day.isRest) {
    return (
      <div className={baseCard}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-400">{day.day}</span>
            {isToday && <span className="text-xs text-indigo-400 font-medium">Today</span>}
          </div>
          <button
            onClick={() => updateDay(day.day, { isRest: false })}
            className="text-xs px-2.5 py-1 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition"
          >
            Rest Day
          </button>
        </div>
        <p className="text-gray-700 text-xs">Click "Rest Day" to toggle back to a workout.</p>
      </div>
    )
  }

  return (
    <div className={baseCard}>

      {/* Header — day name + today badge + rest toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-400">{day.day}</span>
          {isToday && <span className="text-xs text-indigo-400 font-medium">Today</span>}
        </div>
        <button
          onClick={() => updateDay(day.day, { isRest: true })}
          className="text-xs px-2.5 py-1 rounded-full border border-gray-700 text-gray-500
                     hover:border-gray-500 hover:text-gray-300 transition"
        >
          Set Rest
        </button>
      </div>

      {/* Split name */}
      <input
        type="text"
        value={day.splitName}
        onChange={e => updateDay(day.day, { splitName: e.target.value })}
        placeholder="Split name (e.g. Push)"
        className="bg-transparent text-white font-bold text-base placeholder-gray-700
                   border-b border-transparent focus:border-gray-600 focus:outline-none pb-1 transition w-full"
      />

      {/* Exercise list */}
      {day.exercises.length > 0 ? (
        <div className="flex flex-col gap-2.5 mt-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="flex-1">Exercise</span>
            <span className="w-10 text-center">Sets</span>
            <span className="text-gray-700">×</span>
            <span className="w-10 text-center">Reps</span>
            <span className="w-5" />
          </div>
          {day.exercises.map(ex => (
            <ExerciseRow key={ex.id} dayName={day.day} exercise={ex} />
          ))}
        </div>
      ) : (
        <p className="text-gray-700 text-xs mt-1">No exercises yet.</p>
      )}

      {/* Add exercise */}
      <button
        onClick={() => addExercise(day.day)}
        className="text-xs text-gray-600 hover:text-indigo-400 transition text-left"
      >
        + Add exercise
      </button>
    </div>
  )
}
