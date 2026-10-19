
const express = require('express');
const path = require('path');

let db;
try {
    const { DatabaseSync } = require('node:sqlite');
    db = new DatabaseSync(path.join(__dirname, 'polar.db'));
} catch (e) {
    console.error('Не удалось подключить node:sqlite.');
    console.error('Нужен Node.js 22.5+ (или запуск с --experimental-sqlite).');
    console.error('Подробнее:', e.message);
    process.exit(1);
}

db.exec(`
    CREATE TABLE IF NOT EXISTS history (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        x         REAL NOT NULL,
        y         REAL NOT NULL,
        r         REAL NOT NULL,
        phi_rad   REAL NOT NULL,
        phi_deg   REAL NOT NULL,
        created_at TEXT NOT NULL
    )
`);

const app = express();
app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

const toPolar = (x, y) => {
    const r = Math.sqrt(x * x + y * y);
    const phiRad = Math.atan2(y, x);
    return { r, phiRad, phiDeg: phiRad * 180 / Math.PI };
};

const nowIso = () => new Date().toISOString();

app.get('/', (req, res) => {
    res.json({
        name: 'polar-lab API',
        version: '1.0.0',
        endpoints: {
            'GET    /api/health':  'Проверка, что сервер запущен',
            'POST   /api/polar':   'Тело: { "x": number, "y": number } -> сохраняет и возвращает (ρ, φ)',
            'GET    /api/history': 'Последние 50 вычислений (свежие сверху)',
            'DELETE /api/history': 'Очистить историю',
        },
        examples: {
            polar: 'curl -X POST http://localhost:3001/api/polar -H "Content-Type: application/json" -d \'{"x":3,"y":4}\'',
        },
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/api/polar', (req, res, next) => {
    try {
        const { x, y } = req.body ?? {};
        if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) {
            return res.status(400).json({ error: 'Ожидаются числа x и y' });
        }

        const { r, phiRad, phiDeg } = toPolar(x, y);
        const createdAt = nowIso();

        const stmt = db.prepare(
            'INSERT INTO history (x, y, r, phi_rad, phi_deg, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const info = stmt.run(x, y, r, phiRad, phiDeg, createdAt);

        res.status(201).json({
            id: Number(info.lastInsertRowid),
            x, y,
            r,
            phi_rad: phiRad,
            phi_deg: phiDeg,
            created_at: createdAt,
        });
    } catch (err) {
        next(err);
    }
});

app.get('/api/history', (req, res, next) => {
    try {
        const rows = db.prepare('SELECT * FROM history ORDER BY id DESC LIMIT 50').all();
        res.json(rows);
    } catch (err) {
        next(err);
    }
});


app.delete('/api/history', (req, res, next) => {
    try {
        db.prepare('DELETE FROM history').run();
        res.json({ deleted: true });
    } catch (err) {
        next(err);
    }
});


app.use((req, res) => {
    res.status(404).json({ error: `Не найдено: ${req.method} ${req.originalUrl}` });
});


app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log(`База данных:    ${path.join(__dirname, 'polar.db')}`);
});