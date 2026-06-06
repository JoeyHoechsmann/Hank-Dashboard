// Hank - batch update May 30 & May 31 tasks to Jun 20
// Run with: node fix-dates.js

const BASE = 'https://hank-dashboard-production.up.railway.app'

async function run() {
  console.log('Fetching tasks...')
  const res   = await fetch(`${BASE}/api/tasks`)
  const tasks = await res.json()

  const updated = tasks.map(t => {
    if (t.due === 'May 30' || t.due === 'May 31') {
      return { ...t, due: 'Jun 20', overdue: false }
    }
    return t
  })

  const changed = tasks.filter(t => t.due === 'May 30' || t.due === 'May 31')
  console.log(`\nUpdating ${changed.length} tasks to Jun 20:`)
  changed.forEach(t => console.log(`  - ${t.name} (was ${t.due})`))

  await fetch(`${BASE}/api/tasks/sync`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(updated),
  })

  console.log('\nDone! All updated to Jun 20.')
}

run().catch(err => console.error('Error:', err.message))
