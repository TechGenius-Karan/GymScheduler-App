import { useSchedule } from '../context/ScheduleContext'

export default function EmptyScheduleState({ onPickSplit }) {
  const { startFresh } = useSchedule()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 text-center">
      {/* Barbell illustration */}
      <div className="text-indigo-400/70">
        <svg viewBox="0 0 280 100" className="w-80 h-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          {/* Left large plate */}
          <rect x="8" y="8" width="32" height="84" rx="8" opacity="0.95" />
          {/* Left large plate inner detail */}
          <rect x="16" y="20" width="10" height="60" rx="4" opacity="0.2" fill="black" />
          {/* Left collar */}
          <rect x="44" y="30" width="14" height="40" rx="4" opacity="0.8" />
          {/* Bar */}
          <rect x="58" y="42" width="164" height="16" rx="8" opacity="0.4" />
          {/* Right collar */}
          <rect x="222" y="30" width="14" height="40" rx="4" opacity="0.8" />
          {/* Right large plate */}
          <rect x="240" y="8" width="32" height="84" rx="8" opacity="0.95" />
          {/* Right large plate inner detail */}
          <rect x="254" y="20" width="10" height="60" rx="4" opacity="0.2" fill="black" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-3">
        <h2 className="text-4xl font-bold text-white">Your week is empty.</h2>
        <p className="text-gray-400 text-base max-w-sm mx-auto leading-relaxed">
          Build your training split in 30 seconds — pick a template or start from scratch.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={onPickSplit}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-semibold rounded-2xl transition"
        >
          Pick a Split
        </button>
        <button
          onClick={startFresh}
          className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white text-base font-semibold rounded-2xl transition"
        >
          Start Fresh
        </button>
      </div>
    </div>
  )
}
