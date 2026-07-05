import { useSchedule } from '../context/ScheduleContext'
import { useAuth } from '../context/AuthContext'
import ExerciseRow from './ExerciseRow'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { getRestPhrase } from '../utils/dayPhrase'

export default function DayCard({ day, isToday, restIndex }) {
  const { updateDay, addExercise, reorderExercises } = useSchedule()
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] ?? null

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = day.exercises.findIndex(ex => ex.id === active.id)
    const newIndex = day.exercises.findIndex(ex => ex.id === over.id)
    reorderExercises(day.day, oldIndex, newIndex)
  }

  const baseCard = `rounded-xl p-4 flex flex-col gap-3 border transition-colors ${
    isToday
      ? 'bg-gray-900 border-indigo-400 border-2 ring-2 ring-indigo-500/40'
      : 'bg-gray-900 border-gray-800'
  }`

  if (day.isRest) {
    const restCard = `rounded-xl p-4 flex flex-col gap-3 border transition-colors ${
      isToday
        ? 'bg-gray-900/60 border-indigo-400/40 border-2 ring-2 ring-indigo-500/20'
        : 'bg-gray-900/60 border-gray-800/50'
    }`

    return (
      <div className={restCard}>
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-500">{day.day}</span>
          {isToday && <span className="text-sm text-indigo-400 font-medium">Today</span>}
        </div>

        {/* Rest body */}
        <div className="flex flex-col items-center justify-center gap-2 py-5">
          <span className="text-4xl">💤</span>
          <span className="text-base font-semibold text-gray-400">Rest Day</span>
          <p className="text-xs text-gray-600 text-center">
            {getRestPhrase(restIndex, firstName)}
          </p>
        </div>

        {/* Toggle */}
        <button
          onClick={() => updateDay(day.day, { isRest: false })}
          className="text-xs text-gray-600 border border-gray-700 rounded-lg px-3 py-1.5 hover:border-gray-500 hover:text-gray-400 transition self-center"
        >
          Set as workout day
        </button>
      </div>
    )
  }

  return (
    <div className={baseCard}>

      {/* Header — day name + today badge + rest toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-400">{day.day}</span>
          {isToday && <span className="text-sm text-indigo-400 font-medium">Today</span>}
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
            <span className="w-3" />
            <span className="flex-1">Exercise</span>
            <span className="w-10 text-center">Sets</span>
            <span className="text-gray-700">×</span>
            <span className="w-10 text-center">Reps</span>
            <span className="w-5" />
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={day.exercises.map(ex => ex.id)} strategy={verticalListSortingStrategy}>
              {day.exercises.map(ex => (
                <ExerciseRow key={ex.id} dayName={day.day} exercise={ex} />
              ))}
            </SortableContext>
          </DndContext>
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
