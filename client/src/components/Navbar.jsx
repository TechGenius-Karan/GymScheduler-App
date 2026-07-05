import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSchedule } from '../context/ScheduleContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { activeView, setActiveView, myScheduleData } = useSchedule()
  const navigate = useNavigate()
  const location = useLocation()

  const onSchedulePage = location.pathname === '/schedule'
  const showChangeSplit = onSchedulePage && activeView === 'mySchedule' && myScheduleData

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleChangeSplit() {
    setActiveView('splitPicker')
  }

  const logoutIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )

  return (
    <nav className="border-b border-gray-800 bg-gray-900 px-4 sm:px-8 py-3 sticky top-0 z-10">

      {/* Primary row — always visible */}
      <div className="flex items-center justify-between">

        {/* Left: logo + desktop nav links */}
        <div className="flex items-center gap-6">
          <span className="font-black text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
            GymScheduler
          </span>
          <div className="hidden sm:flex items-center gap-6">
            <Link to="/schedule" className={`text-base transition ${location.pathname === '/schedule' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              My Schedule
            </Link>
            <Link to="/tools" className={`text-base transition ${location.pathname === '/tools' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              Tools
            </Link>
          </div>
        </div>

        {/* Right: Change Split (desktop only) + Logout */}
        <div className="flex items-center gap-3">
          {showChangeSplit && (
            <button
              onClick={handleChangeSplit}
              className="hidden sm:block text-base px-3 py-1.5 rounded-lg border border-amber-500 text-amber-400
                         hover:border-amber-400 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 transition"
            >
              Change Split
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm sm:text-base text-red-500 hover:text-red-400 transition sm:ml-4"
          >
            {logoutIcon}
            Logout
          </button>
        </div>

      </div>

      {/* Mobile-only secondary row: nav links + Change Split */}
      <div className="flex sm:hidden items-center gap-5 mt-2.5 pt-2.5 border-t border-gray-800/60">
        <Link to="/schedule" className={`text-sm transition ${location.pathname === '/schedule' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
          My Schedule
        </Link>
        <Link to="/tools" className={`text-sm transition ${location.pathname === '/tools' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
          Tools
        </Link>
        {showChangeSplit && (
          <button
            onClick={handleChangeSplit}
            className="ml-auto text-sm px-2.5 py-1 rounded-lg border border-amber-500 text-amber-400
                       bg-amber-500/10 transition"
          >
            Change Split
          </button>
        )}
      </div>

    </nav>
  )
}
