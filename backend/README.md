# File Transfer Backend

Simple Express backend for temporary file sharing used by the ShareIt frontend.

Features:
- POST /api/upload — accept multiple files (multipart/form-data, field name `files`)
- GET /api/share/:shareId — metadata for a share
- GET /api/file/:shareId/:storedName — download a file
- GET /download/:shareId — redirect to frontend share page
- Automatic cleanup of expired shares and files

Setup

1. cd backend
2. npm install
3. Copy `.env.example` to `.env` and adjust if needed
4. npm start

Notes
- Files are stored in `backend/uploads/` and metadata in `backend/db.json`.
- TTL defaults to 1 hour; cleanup runs every 5 minutes by default.
