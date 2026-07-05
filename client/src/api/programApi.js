const API = import.meta.env.VITE_API_URL

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

export async function getPrograms() {
  const res = await fetch(`${API}/api/programs`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch programs')
  return res.json()
}

export async function getActiveProgram() {
  const res = await fetch(`${API}/api/programs/active`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch active program')
  return res.json()
}

export async function getProgram(id) {
  const res = await fetch(`${API}/api/programs/${id}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch program')
  return res.json()
}

export async function createProgram(name, days) {
  const res = await fetch(`${API}/api/programs`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, days }),
  })
  if (!res.ok) throw new Error('Failed to create program')
  return res.json()
}

export async function saveProgram(id, days) {
  const res = await fetch(`${API}/api/programs/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ days }),
  })
  if (!res.ok) throw new Error('Failed to save program')
  return res.json()
}

export async function activateProgram(id) {
  const res = await fetch(`${API}/api/programs/${id}/activate`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to switch program')
  return res.json()
}

export async function renameProgram(id, name) {
  const res = await fetch(`${API}/api/programs/${id}/rename`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to rename program')
  return res.json()
}

export async function deleteProgram(id) {
  const res = await fetch(`${API}/api/programs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete program')
  return res.json()
}
