const API = import.meta.env.VITE_API_URL

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

export async function getAllTemplates() {
  const res = await fetch(`${API}/api/templates`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch templates')
  return res.json()
}

export async function getTemplate(id) {
  const res = await fetch(`${API}/api/templates/${id}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch template')
  return res.json()
}
