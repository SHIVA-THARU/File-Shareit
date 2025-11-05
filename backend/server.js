const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { nanoid } = require('nanoid')
const cors = require('cors')

const PORT = process.env.PORT || 5000
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'http://localhost:5173'
const UPLOAD_DIR = path.join(__dirname, 'uploads')
const DB_FILE = path.join(__dirname, 'db.json')
const TTL_MS = (process.env.TTL_SECONDS ? Number(process.env.TTL_SECONDS) * 1000 : 60 * 60 * 1000) // default 1h
const CLEANUP_INTERVAL_MS = (process.env.CLEANUP_INTERVAL_SECONDS ? Number(process.env.CLEANUP_INTERVAL_SECONDS) * 1000 : 5 * 60 * 1000) // 5min

// ensure uploads dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// simple JSON DB helpers
function loadDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    return { shares: {} }
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

const db = loadDB()

const app = express()
app.use(cors())
app.use(express.json())

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${nanoid(6)}${ext}`
    cb(null, name)
  }
})

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }) // 200MB limit

// POST /api/upload
app.post('/api/upload', upload.array('files', 20), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files provided' })

  const shareId = nanoid(8)
  const expiresAt = Date.now() + TTL_MS

  const filesMeta = req.files.map(f => ({
    originalName: f.originalname,
    storedName: f.filename,
    size: f.size
  }))

  db.shares[shareId] = { id: shareId, files: filesMeta, createdAt: Date.now(), expiresAt }
  saveDB(db)

  // return a frontend link (so scanning opens the client) and server download base
  const shareLink = `${FRONTEND_BASE.replace(/\/$/, '')}/share/${shareId}`
  res.json({ shareId, link: shareLink, apiBase: BASE_URL })
})

// GET metadata
app.get('/api/share/:shareId', (req, res) => {
  const { shareId } = req.params
  const entry = db.shares[shareId]
  if (!entry) return res.status(404).json({ error: 'Share not found' })
  res.json(entry)
})

// Download file
app.get('/api/file/:shareId/:storedName', (req, res) => {
  const { shareId, storedName } = req.params
  const entry = db.shares[shareId]
  if (!entry) return res.status(404).json({ error: 'Share not found' })

  const fileMeta = entry.files.find(f => f.storedName === storedName)
  if (!fileMeta) return res.status(404).json({ error: 'File not found for this share' })

  const filePath = path.join(UPLOAD_DIR, storedName)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server' })

  res.download(filePath, fileMeta.originalName)
})

// optional redirect route to frontend (if someone opens backend link directly)
app.get('/download/:shareId', (req, res) => {
  const { shareId } = req.params
  res.redirect(302, `${FRONTEND_BASE.replace(/\/$/, '')}/share/${shareId}`)
})

// cleanup expired files
function cleanupExpired() {
  const now = Date.now()
  const dbChanged = []

  for (const [id, entry] of Object.entries(db.shares)) {
    if (entry.expiresAt <= now) {
      // delete files
      for (const f of entry.files) {
        const p = path.join(UPLOAD_DIR, f.storedName)
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p)
        } catch (err) {
          console.error('Failed to delete file', p, err)
        }
      }
      delete db.shares[id]
      dbChanged.push(id)
    }
  }

  if (dbChanged.length > 0) {
    saveDB(db)
    console.log(`Cleaned up shares: ${dbChanged.join(', ')}`)
  }
}

setInterval(cleanupExpired, CLEANUP_INTERVAL_MS)

app.listen(PORT, () => {
  console.log(`Backend running on ${BASE_URL}`)
  console.log(`Frontend base configured as ${FRONTEND_BASE}`)
})
