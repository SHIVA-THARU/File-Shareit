import React, { useState } from 'react'
import axios from 'axios'
import QRCode from 'qrcode.react'

// Change this to your backend API base URL
const API = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export default function App() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [shareLink, setShareLink] = useState(null)

  const onFileChange = (e) => setFiles(Array.from(e.target.files))

  const upload = async () => {
    if (files.length === 0) return alert('Please select files first!')
    setUploading(true)

    const fd = new FormData()
    files.forEach(f => fd.append('files', f))

    try {
      const res = await axios.post(`${API}/api/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShareLink(res.data.link)
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container">
      <h1>📸 ShareIt Web — Android ↔ iOS File Transfer</h1>
      <div className="panel">
        <input type="file" multiple accept="image/*,video/*" onChange={onFileChange} />
        <div style={{ marginTop: 10 }}>
          <button onClick={upload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload & Get Link'}
          </button>
        </div>
      </div>

      {shareLink && (
        <div className="panel">
          <p>Share this link or scan the QR code from another device:</p>
          <a href={shareLink} target="_blank" rel="noreferrer">{shareLink}</a>
          <div style={{ marginTop: 12 }}>
            <QRCode value={shareLink} size={160} />
          </div>
        </div>
      )}

      <footer style={{ marginTop: 20, opacity: 0.7 }}>
        Files are temporary and auto-expire. Secure, simple, and cross-platform.
      </footer>
    </div>
  )
}