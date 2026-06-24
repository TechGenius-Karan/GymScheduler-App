import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMe } from '../api/authApi'

export default function AuthCallbackPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    getMe(token)
      .then(user => {
        login(token, user)
        navigate('/schedule', { replace: true })
      })
      .catch(() => navigate('/login', { replace: true }))
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
      Signing you in...
    </div>
  )
}
