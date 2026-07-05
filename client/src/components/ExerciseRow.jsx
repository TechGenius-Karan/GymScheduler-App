import { useSchedule } from '../context/ScheduleContext'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function ExerciseRow({ dayName, exercise }) {
  const { updateExercise, removeExercise } = useSchedule()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  function handleChange(field, value) {
    if (field === 'sets' || field === 'reps') {
      const parsed = parseInt(value, 10)
      updateExercise(dayName, exercise.id, { [field]: isNaN(parsed) ? '' : parsed })
    } else {
      updateExercise(dayName, exercise.id, { [field]: value })
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-500 hover:text-gray-300 transition cursor-grab active:cursor-grabbing shrink-0 touch-none sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 1.5h8M1 5h8M1 8.5h8"/>
        </svg>
      </button>
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
        className="text-gray-500 hover:text-red-400 transition ml-1 sm:opacity-0 sm:group-hover:opacity-100 text-lg leading-none"
        aria-label="Remove exercise"
      >
        ×
      </button>
    </div>
  )
}
