const API = import.meta.env.VITE_API_URL

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

export async function getSchedule() {
  const res = await fetch(`${API}/api/schedule`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch schedule')
  return res.json()
}

export async function saveSchedule(days) {
  const res = await fetch(`${API}/api/schedule`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ days }),
  })
  if (!res.ok) throw new Error('Failed to save schedule')
  return res.json()
}
