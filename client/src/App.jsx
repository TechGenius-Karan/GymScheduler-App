import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import SchedulePage from './pages/SchedulePage'
import ToolsPage from './pages/ToolsPage'
import Navbar from './components/Navbar'
import LoadingScreen from './components/LoadingScreen'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-950 text-white">
                <Navbar />
                <Routes>
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/tools" element={<ToolsPage />} />
                  <Route path="*" element={<Navigate to="/schedule" replace />} />
                </Routes>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
