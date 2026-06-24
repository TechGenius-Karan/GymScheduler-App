const API = import.meta.env.VITE_API_URL

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white tracking-tight">Gym Scheduler</h1>
        <p className="text-gray-400 text-sm text-center">Plan your weekly training split.</p>
        <a
          href={`${API}/auth/google`}
          className="flex items-center gap-3 bg-white text-gray-900 font-medium px-5 py-3 rounded-lg hover:bg-gray-100 transition w-full justify-center"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </a>
      </div>
    </div>
  )
}
