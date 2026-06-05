require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express = require('express')
const cors    = require('cors')
const path    = require('path')
const { google } = require('googleapis')
const { pool, initDB } = require('./database')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ── Google OAuth setup ────────────────────────────────────────────────

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

// ── Health ────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hank backend running' })
})

// ── Google Calendar auth ──────────────────────────────────────────────

app.get('/api/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent'
  })
  res.redirect(url)
})

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query
    const { tokens } = await oauth2Client.getToken(code)
    if (tokens.refresh_token) {
      await pool.query(
        'INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
        ['google_refresh_token', tokens.refresh_token]
      )
    }
    // Also store access token in case refresh token not returned
    if (tokens.access_token) {
      await pool.query(
        'INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
        ['google_access_token', tokens.access_token]
      )
    }
    res.redirect('/?calendar=connected')
  } catch (err) {
    console.error('Google auth callback error:', err.message)
    res.redirect('/?calendar=error')
  }
})

// ── Calendar events ───────────────────────────────────────────────────

app.get('/api/calendar/today', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM settings WHERE key IN ($1,$2)',
      ['google_refresh_token', 'google_access_token']
    )
    const tokenMap = {}
    rows.forEach(r => { tokenMap[r.key] = r.value })

    if (!tokenMap.google_refresh_token && !tokenMap.google_access_token) {
      return res.json({ connected: false, events: [] })
    }

    oauth2Client.setCredentials({
      refresh_token: tokenMap.google_refresh_token,
      access_token:  tokenMap.google_access_token,
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 30
    })

    const events = (response.data.items || []).map(e => ({
      id:     e.id,
      title:  e.summary || 'Untitled',
      start:  e.start.dateTime || e.start.date,
      end:    e.end.dateTime   || e.end.date,
      allDay: !e.start.dateTime,
      color:  e.colorId ? colorFromId(e.colorId) : '#1a73e8'
    }))

    res.json({ connected: true, events })
  } catch (err) {
    console.error('Calendar fetch error:', err.message)
    res.json({ connected: false, events: [], error: err.message })
  }
})

function colorFromId(id) {
  const colors = {
    '1':'#7986cb','2':'#33b679','3':'#8e24aa','4':'#e67c73',
    '5':'#f6bf26','6':'#f4511e','7':'#039be5','8':'#616161',
    '9':'#3f51b5','10':'#0b8043','11':'#d50000'
  }
  return colors[id] || '#1a73e8'
}

// ── Tasks ─────────────────────────────────────────────────────────────

app.get('/api/tasks', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks ORDER BY id')
    res.json(rows)
  } catch (err) {
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
        [t.id,t.status,t.name,t.biz,t.horizon,t.added||'',t.due||'',t.overdue||false,t.flagged||false,t.delegate||'']
      )
    }
    await client.query('COMMIT')
    res.json({ success: true, count: tasks.length })
  } catch (err) {
    await client.query('ROLLBACK')
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
      [t.status,t.name,t.biz,t.horizon,t.added||'',t.due||'',t.overdue||false,t.flagged||false,t.delegate||'',req.params.id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/tasks', async (req, res) => {
  const t = req.body
  try {
    await pool.query(
      `INSERT INTO tasks (id,status,name,biz,horizon,added,due,overdue,flagged,delegate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [t.id,t.status,t.name,t.biz,t.horizon,t.added||'',t.due||'',t.overdue||false,t.flagged||false,t.delegate||'']
    )
    res.json({ success: true })
  } catch (err) {
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
      await client.query('INSERT INTO goals (text,position) VALUES ($1,$2)', [goals[i], i])
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
