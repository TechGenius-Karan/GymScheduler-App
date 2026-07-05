export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 gap-8">

      {/* Bicep image */}
      <div className="bg-gray-950 rounded-3xl p-6">
        <img src="/bicep.png" alt="flexed bicep" className="w-40 h-40 object-contain" />
      </div>

      {/* Title + spinner row */}
      <div className="flex flex-col items-center gap-5">
        <p className="text-white text-2xl font-bold tracking-wide">Loading...</p>

        {/* Circular spinner */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
        </div>
      </div>

      {/* Context subtext */}
      <p className="text-gray-600 text-sm">The server is warming up — just a moment.</p>

    </div>
  )
}
