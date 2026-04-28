'use strict';

const path    = require('path');
const express = require('express');
const cors    = require('cors');
const Database = require('better-sqlite3');

const PORT   = process.env.PORT || 5008;
const DB_PATH = path.join(__dirname, 'tsl.db');

/* ── Database setup ── */
const db = new Database(DB_PATH);

/* Improve concurrent-access performance and balanced durability */
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS state (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS log_entries (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    zeit      TEXT    NOT NULL,
    von       TEXT    NOT NULL DEFAULT '',
    an        TEXT    NOT NULL DEFAULT '',
    art       TEXT    NOT NULL DEFAULT '',
    inhalt    TEXT    NOT NULL DEFAULT '',
    created_at TEXT   NOT NULL DEFAULT (datetime('now'))
  );
`);

/* Prepared statements */
const stmtGetState   = db.prepare('SELECT value FROM state WHERE key = ?');
const stmtSetState   = db.prepare('INSERT OR REPLACE INTO state (key, value) VALUES (?, ?)');

const stmtGetLog     = db.prepare('SELECT id, zeit, von, an, art, inhalt FROM log_entries ORDER BY id ASC');
const stmtInsertLog  = db.prepare('INSERT INTO log_entries (zeit, von, an, art, inhalt) VALUES (@zeit, @von, @an, @art, @inhalt)');
const stmtDeleteLog  = db.prepare('DELETE FROM log_entries WHERE id = ?');
const stmtClearLog   = db.prepare('DELETE FROM log_entries');

/* Helper: read a JSON value from state table */
function getJson(key, fallback = null) {
  const row = stmtGetState.get(key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return fallback; }
}

/* Helper: write a JSON value into state table */
function setJson(key, value) {
  stmtSetState.run(key, JSON.stringify(value));
}

/* ── Express app ── */
const app = express();
app.use(cors());
/* 512 KB limit is more than sufficient for this app's data structures */
app.use(express.json({ limit: '512kb' }));

/* Serve only the frontend assets from the public directory */
app.use(express.static(path.join(__dirname, 'public')));

/* ── API: Load full state ── */
app.get('/api/state', (req, res) => {
  try {
    const logRows = stmtGetLog.all();

    const state = {
      units:           getJson('units',           []),
      types:           getJson('types',           []),
      log:             logRows.map(r => ({ zeit: r.zeit, von: r.von, an: r.an, art: r.art, inhalt: r.inhalt })),
      unitStatuses:    getJson('unitStatuses',    {}),
      customStatuses:  getJson('customStatuses',  []),
      builtinStatuses: getJson('builtinStatuses', []),
      builtinLabels:   getJson('builtinLabels',   {}),
      builtinColors:   getJson('builtinColors',   {}),
      typeColors:      getJson('typeColors',      {}),
      lastSaved:       getJson('lastSaved',       null),
    };
    res.json(state);
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── API: Save full state ── */
app.post('/api/state', (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const saveAll = db.transaction(() => {
      if (Array.isArray(body.units))           setJson('units',           body.units);
      if (Array.isArray(body.types))           setJson('types',           body.types);
      if (body.unitStatuses   != null)         setJson('unitStatuses',    body.unitStatuses);
      if (Array.isArray(body.customStatuses))  setJson('customStatuses',  body.customStatuses);
      if (Array.isArray(body.builtinStatuses)) setJson('builtinStatuses', body.builtinStatuses);
      if (body.builtinLabels  != null)         setJson('builtinLabels',   body.builtinLabels);
      if (body.builtinColors  != null)         setJson('builtinColors',   body.builtinColors);
      if (body.typeColors     != null)         setJson('typeColors',      body.typeColors);
      setJson('lastSaved', Date.now());

      /* Sync log entries: replace all with incoming data */
      if (Array.isArray(body.log)) {
        stmtClearLog.run();
        for (const e of body.log) {
          stmtInsertLog.run({
            zeit:   String(e.zeit   || ''),
            von:    String(e.von    || ''),
            an:     String(e.an     || ''),
            art:    String(e.art    || ''),
            inhalt: String(e.inhalt || ''),
          });
        }
      }
    });
    saveAll();

    res.json({ ok: true, savedAt: Date.now() });
  } catch (err) {
    console.error('POST /api/state error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── API: Append a single log entry ── */
app.post('/api/log', (req, res) => {
  try {
    const e = req.body;
    if (!e || typeof e !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const info = stmtInsertLog.run({
      zeit:   String(e.zeit   || ''),
      von:    String(e.von    || ''),
      an:     String(e.an     || ''),
      art:    String(e.art    || ''),
      inhalt: String(e.inhalt || ''),
    });
    res.json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error('POST /api/log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── API: Delete a log entry by position (0-based index in current log) ── */
app.delete('/api/log/:index', (req, res) => {
  try {
    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx) || idx < 0) {
      return res.status(400).json({ error: 'Invalid index' });
    }
    const rows = stmtGetLog.all();
    if (idx >= rows.length) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    stmtDeleteLog.run(rows[idx].id);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── Start ── */
app.listen(PORT, () => {
  console.log(`TSL Backend running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
