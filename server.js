const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Buat folder uploads jika belum ada
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Konfigurasi Multer untuk Upload Foto/Video
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Endpoint Upload File (Foto Studio, Promo, Frame, Lokasi, Video)
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
});

// ================= API ADMIN (POIN 14) =================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT id, username, name FROM admins WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ success: false, message: 'Username atau password salah!' });
        res.json({ success: true, admin: row });
    });
});

app.get('/api/admins', (req, res) => {
    db.all(`SELECT id, username, name, created_at FROM admins ORDER BY id ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/admins', (req, res) => {
    const { username, password, name } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' });
    db.run(`INSERT INTO admins (username, password, name) VALUES (?, ?, ?)`, [username, password, name || username], function(err) {
        if (err) return res.status(400).json({ error: 'Username sudah digunakan!' });
        res.json({ success: true, id: this.lastID });
    });
});

app.delete('/api/admins/:id', (req, res) => {
    db.get(`SELECT COUNT(*) as count FROM admins`, (err, row) => {
        if (row && row.count <= 1) {
            return res.status(400).json({ error: 'Minimal harus ada 1 akun admin aktif!' });
        }
        db.run(`DELETE FROM admins WHERE id = ?`, [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// ================= API RESEND SOFTCOPY (POIN 9 & 10) =================
app.get('/api/resend', (req, res) => {
    db.all(`SELECT * FROM resend_requests ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/resend', (req, res) => {
    const { nama, email, whatsapp, cabang, tanggal_foto, jam_foto, catatan } = req.body;
    db.run(
        `INSERT INTO resend_requests (nama, email, whatsapp, cabang, tanggal_foto, jam_foto, catatan, tindak_lanjut) VALUES (?, ?, ?, ?, ?, ?, ?, 'Belum')`,
        [nama, email, whatsapp, cabang, tanggal_foto, jam_foto, catatan],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.put('/api/resend/:id/status', (req, res) => {
    const { tindak_lanjut } = req.body;
    db.run(`UPDATE resend_requests SET tindak_lanjut = ? WHERE id = ?`, [tindak_lanjut, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/resend/:id', (req, res) => {
    db.run(`DELETE FROM resend_requests WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ================= API CMS SETTINGS (POIN 1, 3, 4, 5, 6, 7, 8, 11, 13) =================
app.get('/api/cms', (req, res) => {
    db.get(`SELECT setting_value FROM cms_settings WHERE setting_key = 'main_cms'`, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row ? JSON.parse(row.setting_value) : null);
    });
});

app.post('/api/cms', (req, res) => {
    const valueStr = JSON.stringify(req.body);
    db.run(
        `INSERT INTO cms_settings (setting_key, setting_value) VALUES ('main_cms', ?)
         ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
        [valueStr],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server OH SNAP! v2 berjalan di http://localhost:${PORT}`);
});