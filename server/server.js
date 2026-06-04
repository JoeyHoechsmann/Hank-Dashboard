const express = require('express')
const cors    = require('cors')
const db      = require('./database')

const app  = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// ── Health check ───────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hank backend running' })
})

// ── Tasks ──────────────────────────────────────────────────────────────

app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY id').all()
  res.json(tasks.map(t => ({ ...t, overdue: t.overdue === 1, flagged: t.flagged === 1 })))
})

app.post('/api/tasks/sync', (req, res) => {
  const tasks = req.body
  const insert = db.prepare(`
    INSERT OR REPLACE INTO tasks (id, status, name, biz, horizon, added, due, overdue, flagged, delegate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  db.transaction(tasks => {
    db.prepare('DELETE FROM tasks').run()
    for (const t of tasks) {
      insert.run(t.id, t.status, t.name, t.biz, t.horizon,
        t.added||'', t.due||'', t.overdue?1:0, t.flagged?1:0, t.delegate||'')
    }
  })(tasks)
  res.json({ success: true, count: tasks.length })
})

app.put('/api/tasks/:id', (req, res) => {
  const t = req.body
  db.prepare(`
    UPDATE tasks SET status=?, name=?, biz=?, horizon=?, added=?, due=?, overdue=?, flagged=?, delegate=?
    WHERE id=?
  `).run(t.status, t.name, t.biz, t.horizon, t.added||'', t.due||'',
    t.overdue?1:0, t.flagged?1:0, t.delegate||'', req.params.id)
  res.json({ success: true })
})

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id)
  res.json({ success: true })
})

app.post('/api/tasks', (req, res) => {
  const t = req.body
  db.prepare(`
    INSERT INTO tasks (id, status, name, biz, horizon, added, due, overdue, flagged, delegate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(t.id, t.status, t.name, t.biz, t.horizon,
    t.added||'', t.due||'', t.overdue?1:0, t.flagged?1:0, t.delegate||'')
  res.json({ success: true })
})

// ── Goals ──────────────────────────────────────────────────────────────

app.get('/api/goals', (req, res) => {
  const rows = db.prepare('SELECT text FROM goals ORDER BY position').all()
  res.json(rows.map(r => r.text))
})

app.post('/api/goals/sync', (req, res) => {
  const goals = req.body
  db.transaction(goals => {
    db.prepare('DELETE FROM goals').run()
    goals.forEach((text, i) => db.prepare('INSERT INTO goals (text, position) VALUES (?, ?)').run(text, i))
  })(goals)
  res.json({ success: true })
})

// ── Settings (mindset etc) ─────────────────────────────────────────────

app.get('/api/settings/:key', (req, res) => {
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(req.params.key)
  res.json({ value: row ? row.value : null })
})

app.put('/api/settings/:key', (req, res) => {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(req.params.key, req.body.value)
  res.json({ success: true })
})

// ── Start ──────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Hank backend running on http://localhost:${PORT}`)
})
