const API = import.meta.env.VITE_API_URL

export async function getMe(token) {
  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}
