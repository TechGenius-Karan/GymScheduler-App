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

  return (
    <nav className="border-b border-gray-800 bg-gray-900 px-4 py-3 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        <div className="flex items-center gap-6">
          <span className="font-bold text-white text-lg tracking-tight">GymScheduler</span>
          <Link
            to="/schedule"
            className={`text-sm transition ${location.pathname === '/schedule' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          >
            My Schedule
          </Link>
          <Link
            to="/tools"
            className={`text-sm transition ${location.pathname === '/tools' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Tools
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {showChangeSplit && (
            <button
              onClick={handleChangeSplit}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300
                         hover:border-gray-500 hover:text-white transition"
            >
              Change Split
            </button>
          )}
          {user?.picture && (
            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  )
}
