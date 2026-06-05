require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express = require('express')
const cors    = require('cors')
const path    = require('path')
const { pool, initDB } = require('./database')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ── Health ────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hank backend running' })
})

// ── Tasks ─────────────────────────────────────────────────────────────

app.get('/api/tasks', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks ORDER BY id')
    res.json(rows)
  } catch (err) {
    console.error('GET /api/tasks:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/tasks/sync', async (req, res) => {
  const tasks = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM tasks')
    for (const t of tasks) {
      await client.query(
        `INSERT INTO tasks (id,status,name,biz,horizon,added,due,overdue,flagged,delegate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [t.id, t.status, t.name, t.biz, t.horizon,
         t.added||'', t.due||'', t.overdue||false, t.flagged||false, t.delegate||'']
      )
    }
    await client.query('COMMIT')
    res.json({ success: true, count: tasks.length })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('POST /api/tasks/sync:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

app.put('/api/tasks/:id', async (req, res) => {
  const t = req.body
  try {
    await pool.query(
      `UPDATE tasks SET status=$1,name=$2,biz=$3,horizon=$4,added=$5,
       due=$6,overdue=$7,flagged=$8,delegate=$9 WHERE id=$10`,
      [t.status, t.name, t.biz, t.horizon, t.added||'',
       t.due||'', t.overdue||false, t.flagged||false, t.delegate||'', req.params.id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('PUT /api/tasks/:id:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/tasks/:id:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/tasks', async (req, res) => {
  const t = req.body
  try {
    await pool.query(
      `INSERT INTO tasks (id,status,name,biz,horizon,added,due,overdue,flagged,delegate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [t.id, t.status, t.name, t.biz, t.horizon,
       t.added||'', t.due||'', t.overdue||false, t.flagged||false, t.delegate||'']
    )
    res.json({ success: true })
  } catch (err) {
    console.error('POST /api/tasks:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Goals ─────────────────────────────────────────────────────────────

app.get('/api/goals', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT text FROM goals ORDER BY position')
    res.json(rows.map(r => r.text))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/goals/sync', async (req, res) => {
  const goals = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM goals')
    for (let i = 0; i < goals.length; i++) {
      await client.query('INSERT INTO goals (text, position) VALUES ($1,$2)', [goals[i], i])
    }
    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// ── Settings ──────────────────────────────────────────────────────────

app.get('/api/settings/:key', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT value FROM settings WHERE key=$1', [req.params.key])
    res.json({ value: rows[0] ? rows[0].value : null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/settings/:key', async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
      [req.params.key, req.body.value]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Static (production) ───────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

// ── Start ─────────────────────────────────────────────────────────────

initDB()
  .then(() => app.listen(PORT, () => console.log(`Hank backend running on http://localhost:${PORT}`)))
  .catch(err => { console.error('Startup failed:', err); process.exit(1) })
