import { useSchedule } from '../context/ScheduleContext'

export default function ExerciseRow({ dayName, exercise }) {
  const { updateExercise, removeExercise } = useSchedule()

  function handleChange(field, value) {
    if (field === 'sets' || field === 'reps') {
      const parsed = parseInt(value, 10)
      updateExercise(dayName, exercise.id, { [field]: isNaN(parsed) ? '' : parsed })
    } else {
      updateExercise(dayName, exercise.id, { [field]: value })
    }
  }

  return (
    <div className="flex items-center gap-2 group">
      <input
        type="text"
        value={exercise.name}
        onChange={e => handleChange('name', e.target.value)}
        placeholder="Exercise name"
        className="flex-1 min-w-0 bg-transparent text-gray-200 text-sm placeholder-gray-600
                   border-b border-transparent focus:border-gray-600 focus:outline-none py-0.5 transition"
      />
      <input
        type="number"
        value={exercise.sets}
        onChange={e => handleChange('sets', e.target.value)}
        min={1}
        className="w-10 bg-transparent text-center text-gray-400 text-sm
                   border-b border-transparent focus:border-gray-600 focus:outline-none py-0.5 transition"
      />
      <span className="text-gray-600 text-xs">×</span>
      <input
        type="number"
        value={exercise.reps}
        onChange={e => handleChange('reps', e.target.value)}
        min={1}
        className="w-10 bg-transparent text-center text-gray-400 text-sm
                   border-b border-transparent focus:border-gray-600 focus:outline-none py-0.5 transition"
      />
      <button
        onClick={() => removeExercise(dayName, exercise.id)}
        className="text-gray-700 hover:text-red-400 transition ml-1 opacity-0 group-hover:opacity-100 text-lg leading-none"
        aria-label="Remove exercise"
      >
        ×
      </button>
    </div>
  )
}
