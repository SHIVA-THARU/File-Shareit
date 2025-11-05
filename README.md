# ShareIt - Cross-Platform File Transfer

Simple and secure file sharing between devices. Upload files and share via link or QR code.

## Features

- 📱 Works on any device with a browser
- 🔗 Share via link or QR code
- ⚡ Fast direct downloads
- ⏳ Files auto-expire after 1 hour
- 🔒 Secure and private

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- File Storage: Local (configurable for S3)
- Database: Simple JSON store

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### Backend

```bash
cd backend
npm install
npm start
```

Backend API runs on http://localhost:5000

## API Routes

- `POST /api/upload` - Upload files (multipart/form-data)
- `GET /api/share/:id` - Get share metadata
- `GET /api/file/:shareId/:filename` - Download file
- `GET /download/:shareId` - Redirect to frontend share page

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE=http://localhost:5000
```

### Backend (.env)
```
PORT=5000
FRONTEND_BASE=http://localhost:5173
TTL_SECONDS=3600
```

## Deployment

- Frontend: GitHub Pages
- Backend: Railway/Render (choose your preferred host)

## License

MIT