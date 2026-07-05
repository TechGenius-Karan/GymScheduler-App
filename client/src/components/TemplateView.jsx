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
      <div className="mt-6 animate-pulse">
        {/* Title + description placeholders */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="h-6 w-40 bg-gray-800 rounded" />
          <div className="h-4 w-64 bg-gray-800 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
              {/* Day name */}
              <div className="h-4 w-16 bg-gray-700 rounded" />
              {/* Split name */}
              <div className="h-5 w-24 bg-gray-700 rounded" />
              {/* Exercise lines */}
              <div className="flex flex-col gap-2 mt-1">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between gap-4">
                    <div className={`h-3 bg-gray-700 rounded ${j % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
                    <div className="h-3 w-10 bg-gray-700 rounded shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
