import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export default function SharePage() {
  const { id } = useParams()
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/share/${id}`)
      .then(res => setMeta(res.data))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load'))
  }, [id])

  if (error) return <div className="container"><h2>{error}</h2></div>
  if (!meta) return <div className="container"><h2>Loading...</h2></div>

  return (
    <div className="container">
      <h1>Download Files</h1>
      <p>Expires: {new Date(meta.expiresAt).toLocaleString()}</p>
      <ul>
        {meta.files.map(f => (
          <li key={f.storedName} style={{ marginBottom: 10 }}>
            <strong>{f.filename}</strong> ({Math.round(f.size / 1024)} KB)
            <div style={{ marginTop: 5 }}>
              <a href={`${API}/api/file/${id}/${f.storedName}`} target="_blank" rel="noreferrer">Download</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}