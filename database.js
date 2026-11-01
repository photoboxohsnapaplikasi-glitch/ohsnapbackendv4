const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'ohsnap.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Gagal koneksi ke SQLite database:', err.message);
    } else {
        console.log('Terhubung ke SQLite database OH SNAP! v2.');
    }
});

db.serialize(() => {
    // 1. Tabel Admin (Poin 14: Tambah Admin di Backend)
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default admin jika belum ada
    db.get(`SELECT COUNT(*) as count FROM admins`, (err, row) => {
        if (!err && row.count === 0) {
            db.run(`INSERT INTO admins (username, password, name) VALUES ('admin', 'ohsnap123', 'Super Admin OH SNAP!')`);
        }
    });

    // 2. Tabel Resend Softcopy (Poin 9 & 10: Direct Email & Kolom Tindak Lanjut Merah/Hijau)
    db.run(`CREATE TABLE IF NOT EXISTS resend_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT,
        email TEXT,
        whatsapp TEXT,
        cabang TEXT,
        tanggal_foto TEXT,
        jam_foto TEXT,
        catatan TEXT,
        tindak_lanjut TEXT DEFAULT 'Belum',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. Tabel CMS Settings (Menyimpan JSON untuk Poin 1, 3, 4, 5, 6, 7, 8, 11, 13)
    db.run(`CREATE TABLE IF NOT EXISTS cms_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT
    )`);
});

module.exports = db;