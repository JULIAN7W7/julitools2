const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.RENDER ? '/var/data' : __dirname;

const log = (msg, type = 'INFO') => console.log(`[${new Date().toISOString()}] [${type}] ${msg}`);

app.use((req, res, next) => {
  log(`${req.method} ${req.url}`, 'ROUTING');
  next();
});

app.use((err, req, res, next) => {
  log(`ERROR en ${req.method} ${req.url}: ${err.message}`, 'ERROR');
  if (!res.headersSent) res.status(500).json({ error: 'Error interno del servidor' });
});

process.on('uncaughtException', (err) => {
  log(`EXCEPCIÓN NO CAPTURADA: ${err.message}`, 'ERROR');
  log(err.stack || '', 'ERROR');
});

process.on('unhandledRejection', (err) => {
  log(`REJECTION NO MANEJADO: ${err.message || err}`, 'ERROR');
});

const dbPath = path.join(DATA_DIR, 'julitools.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image_path TEXT,
      apk_link TEXT NOT NULL,
      version TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

const uploadDir = path.join(DATA_DIR, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const uploadBaseUrl = process.env.RENDER ? '/var/data/public' : '/uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Solo imágenes: JPG, PNG, WebP, GIF'));
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/api/apps', (req, res) => {
  db.all('SELECT * FROM apps ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/apps', upload.single('image'), (req, res) => {
  const { name, description, apk_link } = req.body;
  if (!name || !apk_link) {
    return res.status(400).json({ error: 'Nombre y LINK son requeridos' });
  }
  const image_path = req.file ? '/uploads/' + req.file.filename : null;
  const stmt = db.prepare('INSERT INTO apps (name, description, image_path, apk_link) VALUES (?, ?, ?, ?)');
  stmt.run(name, description || '', image_path, apk_link, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, description, image_path, apk_link });
  });
  stmt.finalize();
});

app.delete('/api/apps/:id', (req, res) => {
  const appId = req.params.id;
  db.get('SELECT image_path FROM apps WHERE id = ?', [appId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row && row.image_path) {
      const filePath = path.join(__dirname, 'public', row.image_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    db.run('DELETE FROM apps WHERE id = ?', [appId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

app.listen(PORT, () => {
  console.log(`JULITOOLS 2 corriendo en http://localhost:${PORT}`);
});