import { useSchedule } from '../context/ScheduleContext'

function TemplateDayCard({ day }) {
  if (day.isRest) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-400">{day.day}</p>
        <span className="inline-block mt-2 px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">
          Rest Day
        </span>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-400">{day.day}</p>
      <p className="text-white font-bold mt-1">{day.splitName}</p>
      <ul className="mt-3 flex flex-col gap-1.5">
        {day.exercises.map((ex, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-300">{ex.name}</span>
            <span className="text-gray-500 text-xs shrink-0 ml-4">
              {ex.sets} × {ex.reps}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function TemplateView() {
  const { templateData, loadingTemplate } = useSchedule()

  if (loadingTemplate) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!templateData) return null

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{templateData.name}</h3>
        <p className="text-gray-400 text-sm">{templateData.description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templateData.days.map(day => (
          <TemplateDayCard key={day.day} day={day} />
        ))}
      </div>
    </div>
  )
}
