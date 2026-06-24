import { useState } from 'react'

export default function ToolsPage() {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [label, setLabel] = useState('')

  const w = parseFloat(weight)
  const r = parseInt(reps, 10)
  const oneRM = w > 0 && r > 0 ? +(w * (1 + r / 30)).toFixed(1) : null

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-white mb-1">Tools</h2>
      <p className="text-gray-500 text-sm mb-8">Utilities to support your training.</p>

      <div className="max-w-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5">

          <div>
            <h3 className="text-white font-semibold">1RM Calculator</h3>
            <p className="text-gray-500 text-xs mt-0.5">Estimates your one-rep max using the Epley formula.</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Exercise (optional)</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Bench Press"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
                           placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-gray-400">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="80"
                  min={0}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
                             placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-gray-400">Reps</label>
                <input
                  type="number"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  placeholder="8"
                  min={1}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
                             placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 text-center transition-all ${oneRM ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-gray-800 border border-gray-700'}`}>
            {oneRM ? (
              <>
                <p className="text-xs text-indigo-400 mb-1">{label ? `${label} — estimated 1RM` : 'Estimated 1RM'}</p>
                <p className="text-3xl font-bold text-white">{oneRM} <span className="text-lg font-normal text-gray-400">kg</span></p>
                <p className="text-xs text-gray-500 mt-2">Based on {weight} kg × {reps} reps</p>
              </>
            ) : (
              <p className="text-gray-600 text-sm">Enter weight and reps to see your estimated 1RM</p>
            )}
          </div>

          <p className="text-gray-600 text-xs text-center">
            Formula: weight × (1 + reps ÷ 30)
          </p>
        </div>
      </div>
    </main>
  )
}
