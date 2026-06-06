import { useState, useEffect, useRef } from 'react'

const GAMES_DATE = '2026-07-20'
const DAYS_AHEAD = 10
const SYNC_DELAY = 1500

function getToday() {
  return new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
}

const BIZ = {
  'Hush':         { bg:'#dbeafe', color:'#1e40af' },
  'Ashley':       { bg:'#ffedd5', color:'#c2410c' },
  'Liquor Store': { bg:'#fee2e2', color:'#b91c1c' },
  'Rusty Bear':   { bg:'#fef3c7', color:'#78350f' },
  'CrossFit':     { bg:'#dcfce7', color:'#166534' },
  'Personal':     { bg:'#f3e8ff', color:'#7e22ce' },
  'Comm. RE':     { bg:'#e0e7ff', color:'#3730a3' },
  'Land Dev':     { bg:'#e2e8f0', color:'#475569' },
  'DBA':          { bg:'#fef9c3', color:'#854d0e' },
  'DC':           { bg:'#ccfbf1', color:'#0f766e' },
}
const STATUS_OPTS = [
  { value:'todo',  label:'Not started', dot:'#94a3b8', bg:'#f1f5f9', color:'#64748b' },
  { value:'doing', label:'In progress', dot:'#3b82f6', bg:'#eff6ff', color:'#1d4ed8' },
  { value:'done',  label:'Done',        dot:'#22c55e', bg:'#f0fdf4', color:'#15803d' },
]
const HORIZON_OPTS = ['This Week','This Month','This Quarter','Someday']
const HORIZON_COLORS = {
  'This Week':    { bg:'#fef3c7', color:'#92400e' },
  'This Month':   { bg:'#ede9fe', color:'#5b21b6' },
  'This Quarter': { bg:'#dcfce7', color:'#166534' },
  'Someday':      { bg:'#f1f5f9', color:'#64748b' },
}
const DEFAULT_GOALS = ['CrossFit Quarterfinals prep','Premium Appliance Gallery launch','Stone Ridge Estates']

// Slots from 5 AM to 10 PM
function makeSlots(startH, endH) {
  const slots = []
  for (let h = startH; h <= endH; h++) {
    for (const m of [0, 30]) {
      if (h === endH && m === 30) break
      const h12 = h === 0 || h === 12 ? 12 : h % 12
      const label = `${h12}:${m === 0 ? '00' : '30'}`
      slots.push({ h, m, label, isNoon: h === 12 && m === 0 })
    }
  }
  return slots
}
const ALL_SLOTS = makeSlots(6, 21)

// ── Utilities ─────────────────────────────────────────────────────────

function formatDueDate(s) {
  if (!s) return ''
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' })
}
function checkOverdue(s) {
  if (!s) return false
  const d = new Date(s + 'T12:00:00')
  const t = new Date(); t.setHours(0,0,0,0)
  return d < t
}
function toDatInput(display) {
  if (!display) return ''
  const mo = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'}
  const p = display.trim().split(' ')
  if (p.length < 2 || !mo[p[0]]) return ''
  return `2026-${mo[p[0]]}-${String(parseInt(p[1])).padStart(2,'0')}`
}
function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.max(0, Math.ceil((target - today) / 86400000))
}
function dueWithinDays(dueDisplay, days) {
  const ds = toDatInput(dueDisplay)
  if (!ds) return false
  const due = new Date(ds + 'T12:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  return due >= today && due <= new Date(today.getTime() + days * 86400000)
}
function recalcOverdue(tasks) {
  return tasks.map(t => ({ ...t, flagged: t.flagged||false, overdue: t.due ? checkOverdue(toDatInput(t.due)) : false }))
}

// ── Styles ────────────────────────────────────────────────────────────

const card     = { background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #e5e7eb' }
const cardHead = { padding:'8px 14px', borderBottom:'1px solid #f0f0f0', fontSize:11, fontWeight:500, color:'#888', display:'flex', alignItems:'center', gap:8 }
const th       = { textAlign:'left', padding:'7px 10px', fontSize:10, fontWeight:500, color:'#bbb', borderBottom:'1px solid #f0f0f0', whiteSpace:'nowrap', userSelect:'none' }
const labelSt  = { display:'block', fontSize:10, fontWeight:500, color:'#888', marginBottom:4 }
const inputSt  = { width:'100%', border:'1px solid #e5e7eb', borderRadius:6, padding:'7px 10px', fontSize:12, fontFamily:'inherit', color:'#1a1a1a', boxSizing:'border-box', background:'#fff' }
const editInp  = { border:'1px solid #3b82f6', borderRadius:4, padding:'2px 6px', fontSize:11, fontFamily:'inherit', outline:'none', background:'#fff' }

// ── Flag button ───────────────────────────────────────────────────────

function FlagBtn({ flagged, onClick }) {
  const [hov, setHov] = useState(false)
  const color = flagged ? '#dc2626' : (hov ? '#fca5a5' : '#d1d5db')
  return (
    <button onClick={onClick} title={flagged ? 'Flagged — click to unflag' : 'Flag for Do first'}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 5px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4 }}>
      <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
        <line x1="1.5" y1="0.5" x2="1.5" y2="13.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M2 1.5 L12 4.5 L2 8 Z" fill={color}/>
      </svg>
    </button>
  )
}

// ── Dropdown base ─────────────────────────────────────────────────────

function DropMenu({ trigger, children, open, setOpen }) {
  const ref    = useRef(null)
  const trigRef = useRef(null)
  const [pos, setPos] = useState({ top:0, left:0 })

  const handleClick = () => {
    if (!open && trigRef.current) {
      const r = trigRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(p => !p)
  }
  useEffect(() => {
    if (!open) return
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open, setOpen])
  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>
      <div ref={trigRef} onClick={handleClick}>{trigger}</div>
      {open && (
        <div style={{
          position:'fixed', top:pos.top, left:pos.left,
          zIndex:9999, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8,
          boxShadow:'0 8px 24px rgba(0,0,0,0.15)', minWidth:150, overflow:'hidden'
        }}>
          {children}
        </div>
      )}
    </div>
  )
}
function DropOpt({ label, dot, dotStyle, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 12px', background:active?'#f0f4ff':'#fff', border:'none', cursor:'pointer', fontSize:11, color:'#1a1a1a', fontFamily:'inherit', textAlign:'left' }}>
      {dot !== undefined && <span style={{ width:8, height:8, borderRadius:'50%', background:dot||'transparent', flexShrink:0, ...dotStyle }} />}
      {label}
      {active && <span style={{ marginLeft:'auto', color:'#3b82f6', fontSize:12 }}>✓</span>}
    </button>
  )
}
function StatusDropdown({ status, taskId, onSelect }) {
  const [open, setOpen] = useState(false)
  const cur = STATUS_OPTS.find(o=>o.value===status)||STATUS_OPTS[0]
  return (
    <DropMenu open={open} setOpen={setOpen} trigger={
      <button style={{ display:'inline-flex', alignItems:'center', gap:4, background:cur.bg, color:cur.color, border:'none', borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:cur.dot, flexShrink:0 }} />{cur.label} <span style={{ fontSize:8, opacity:0.5 }}>▾</span>
      </button>
    }>
      {STATUS_OPTS.map(o => <DropOpt key={o.value} label={o.label} dot={o.dot} active={status===o.value} onClick={() => { onSelect(taskId,o.value); setOpen(false) }} />)}
    </DropMenu>
  )
}
function HorizonDropdown({ horizon, taskId, onSelect }) {
  const [open, setOpen] = useState(false)
  const c = HORIZON_COLORS[horizon]||HORIZON_COLORS['Someday']
  return (
    <DropMenu open={open} setOpen={setOpen} trigger={
      <button style={{ background:c.bg, color:c.color, border:'none', borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>
        {horizon} <span style={{ fontSize:8, opacity:0.5 }}>▾</span>
      </button>
    }>
      {HORIZON_OPTS.map(h => {
        const hc = HORIZON_COLORS[h]
        return <DropOpt key={h} label={h} dot={hc.bg} dotStyle={{ border:`1px solid ${hc.color}`, borderRadius:3 }} active={horizon===h} onClick={() => { onSelect(taskId,h); setOpen(false) }} />
      })}
    </DropMenu>
  )
}
function BizDropdown({ biz, taskId, onSelect }) {
  const [open, setOpen] = useState(false)
  const c = BIZ[biz]||{ bg:'#f1f5f9', color:'#475569' }
  return (
    <DropMenu open={open} setOpen={setOpen} trigger={
      <button style={{ background:c.bg, color:c.color, border:'none', borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>
        {biz} <span style={{ fontSize:8, opacity:0.5 }}>▾</span>
      </button>
    }>
      {Object.keys(BIZ).map(b => {
        const bc = BIZ[b]
        return <DropOpt key={b} label={b} dot={bc.bg} dotStyle={{ border:`1px solid ${bc.color}` }} active={biz===b} onClick={() => { onSelect(taskId,b); setOpen(false) }} />
      })}
    </DropMenu>
  )
}

// ── Small components ──────────────────────────────────────────────────

function OverdueBadge() {
  return <span style={{ fontSize:9, background:'#fee2e2', color:'#dc2626', padding:'1px 4px', borderRadius:3, marginRight:5, fontWeight:600 }}>overdue</span>
}
function ArchiveXBtn({ onClick }) {
  return (
    <button onClick={onClick} title="Archive this task"
      style={{ background:'none', border:'none', cursor:'pointer', color:'#d1d5db', fontSize:16, lineHeight:1, padding:'0 4px', fontFamily:'inherit' }}
      onMouseEnter={e=>e.currentTarget.style.color='#f97316'}
      onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}>×</button>
  )
}
function EditCell({ value, taskId, field, editing, editVal, setEditVal, onStart, onSave, onCancel, inputStyle={}, spanStyle={} }) {
  if (editing?.id===taskId && editing?.field===field) {
    return (
      <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
        onBlur={onSave} onKeyDown={e=>{if(e.key==='Enter')onSave();if(e.key==='Escape')onCancel()}}
        style={{ ...editInp, ...inputStyle }} />
    )
  }
  return (
    <span onClick={() => onStart(taskId,field,value)} title="Click to edit" style={{ cursor:'text', ...spanStyle }}>
      {value||<span style={{ color:'#ddd' }}>—</span>}
    </span>
  )
}
function DateCell({ value, taskId, onSetDate, spanStyle={} }) {
  const [open, setOpen] = useState(false)
  if (open) {
    return (
      <input type="date" autoFocus defaultValue={toDatInput(value)}
        onChange={e => { if (e.target.value) { onSetDate(taskId,e.target.value); setOpen(false) } }}
        onBlur={() => setOpen(false)} style={{ ...editInp, width:140 }} />
    )
  }
  return (
    <span onClick={() => setOpen(true)} title="Click to change date"
      style={{ cursor:'pointer', textDecoration:'underline dotted', textUnderlineOffset:2, ...spanStyle }}>
      {value||<span style={{ color:'#ddd' }}>—</span>}
    </span>
  )
}
function SortTh({ label, field, sort, onSort, style={} }) {
  const active = sort.field===field
  return (
    <th onClick={() => onSort(field)} style={{ ...th, cursor:'pointer', ...style }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}>
        {label}<span style={{ fontSize:9, color:active?'#3b82f6':'#ddd' }}>{active?(sort.dir==='asc'?'↑':'↓'):'↕'}</span>
      </span>
    </th>
  )
}
function SearchInput({ value, onChange }) {
  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#bbb', fontSize:13, pointerEvents:'none' }}>⌕</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder="Search tasks..."
        style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 24px 4px 26px', fontSize:11, width:170, fontFamily:'inherit', outline:'none', color:'#1a1a1a' }} />
      {value && <button onClick={() => onChange('')} style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:13, padding:0, lineHeight:1 }}>×</button>}
    </div>
  )
}

// ── Master filter bar ─────────────────────────────────────────────────

function MasterFilterBar({ filterView, setFilterView, filterBiz, setFilterBiz }) {
  const [bizOpen, setBizOpen] = useState(false)
  const bizRef = useRef(null)
  useEffect(() => {
    if (!bizOpen) return
    const fn = e => { if (bizRef.current && !bizRef.current.contains(e.target)) setBizOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [bizOpen])
  const views = [
    { id:'week', label:'This week' }, { id:'month', label:'This month' },
    { id:'quarter', label:'This quarter' }, { id:'all', label:'All tasks' },
  ]
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:12 }}>
      <div style={{ display:'flex', gap:3 }}>
        {views.map(v => (
          <button key={v.id} onClick={() => setFilterView(v.id)} style={{
            background:filterView===v.id?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.06)',
            color:filterView===v.id?'#fff':'rgba(255,255,255,0.5)',
            border:'1px solid '+(filterView===v.id?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.12)'),
            borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit',
          }}>{v.label}</button>
        ))}
      </div>
      <div ref={bizRef} style={{ position:'relative' }}>
        <button onClick={() => setBizOpen(p=>!p)} style={{
          background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)',
          border:'1px solid rgba(255,255,255,0.12)', borderRadius:6,
          padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit',
        }}>{filterBiz==='All'?'All businesses':filterBiz} <span style={{ fontSize:9 }}>▾</span></button>
        {bizOpen && (
          <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:400, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', minWidth:160, overflow:'hidden', maxHeight:300, overflowY:'auto' }}>
            {['All',...Object.keys(BIZ)].map(b => (
              <button key={b} onClick={() => { setFilterBiz(b); setBizOpen(false) }}
                style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 12px', background:filterBiz===b?'#f0f4ff':'#fff', border:'none', cursor:'pointer', fontSize:11, color:'#1a1a1a', fontFamily:'inherit', textAlign:'left' }}>
                {b!=='All' && <span style={{ width:8, height:8, borderRadius:'50%', background:BIZ[b]?.bg, border:`1px solid ${BIZ[b]?.color}`, flexShrink:0 }} />}
                {b==='All' && <span style={{ width:8, flexShrink:0 }} />}
                {b}{filterBiz===b && <span style={{ marginLeft:'auto', color:'#3b82f6', fontSize:12 }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Calendar (Google Calendar connected) ──────────────────────────────

// CalSlot now only renders the time grid — events are overlaid absolutely in Calendar
function CalSlot({ slot }) {
  return (
    <div style={{
      display:'flex', alignItems:'center',
      borderBottom: slot.isNoon ? '1px solid #d1d5db' : '1px solid #f0f0f0',
      minHeight: 19,
    }}>
      <span style={{
        fontSize:9, width:36, flexShrink:0, paddingRight:4,
        display:'flex', alignItems:'center', justifyContent:'flex-end',
        color:      slot.isNoon ? '#374151' : '#c0c0c0',
        fontWeight: slot.isNoon ? 600 : 400,
      }}>{slot.label}</span>
    </div>
  )
}

function Calendar() {
  const SLOT_H     = 19
  const START_MINS = 6 * 60
  const TOTAL_MINS = ALL_SLOTS.length * 30

  const [calData,     setCalData]     = useState({ connected: false, events: [] })
  const [currentMins, setCurrentMins] = useState(() => {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes()
  })

  const fetchCalendar = () => {
    const now   = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(),  0,  0,  0).toISOString()
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
    fetch('/api/calendar/today?start=' + encodeURIComponent(start) + '&end=' + encodeURIComponent(end))
      .then(r => r.json())
      .then(setCalData)
      .catch(() => {})
  }

  useEffect(() => {
    fetchCalendar()
    // Auto-refresh every 30 minutes
    const refresh = setInterval(fetchCalendar, 30 * 60 * 1000)
    return () => clearInterval(refresh)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      const n = new Date(); setCurrentMins(n.getHours() * 60 + n.getMinutes())
    }, 60000)
    return () => clearInterval(tick)
  }, [])

  const allEvents   = calData.events || []
  const allDayEvts  = allEvents.filter(e => e.allDay)
  const timedEvts   = allEvents.filter(e => !e.allDay && e.start).map(e => {
    const sMins    = new Date(e.start).getHours() * 60 + new Date(e.start).getMinutes()
    const endDate  = new Date(e.end || e.start)
    const eMinsRaw = endDate.getHours() * 60 + endDate.getMinutes()
    const eMins    = eMinsRaw === sMins ? sMins + 30 : eMinsRaw
    return { ...e, sMins, eMins }
  })

  // Calculate overlap columns for each event
  const getLayout = (e) => {
    const overlapping = timedEvts.filter(o => o.id !== e.id && o.sMins < e.eMins && o.eMins > e.sMins)
    if (overlapping.length === 0) return { colIdx: 0, numCols: 1 }
    const group = [e, ...overlapping].sort((a, b) => a.sMins - b.sMins || a.id.localeCompare(b.id))
    return { colIdx: group.findIndex(g => g.id === e.id), numCols: group.length }
  }

  const lineTop  = ((currentMins - START_MINS) / 30) * SLOT_H
  const showLine = lineTop >= 0 && lineTop <= TOTAL_MINS / 30 * SLOT_H

  return (
    <div style={card}>
      <div style={{ ...cardHead, justifyContent:'space-between' }}>
        <span>Today's schedule</span>
        {!calData.connected
          ? <a href="/api/auth/google" style={{ fontSize:10, color:'#3b82f6', textDecoration:'none', fontWeight:500 }}>Connect Calendar</a>
          : <span style={{ fontSize:9, color:'#22c55e' }}>● Live</span>
        }
      </div>

      {/* All-day events banner */}
      {allDayEvts.length > 0 && (
        <div style={{ padding:'4px 8px 4px 42px', borderBottom:'1px solid #f0f0f0', display:'flex', flexWrap:'wrap', gap:3 }}>
          {allDayEvts.map(e => (
            <span key={e.id} style={{
              background: e.color||'#1a73e8', color:'#fff',
              fontSize:9, fontWeight:500, padding:'2px 7px', borderRadius:3,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:220,
            }}>{e.title}</span>
          ))}
        </div>
      )}

      <div style={{ padding:'8px 12px' }}>
        {!calData.connected && (
          <div style={{ padding:'6px 0 10px', textAlign:'center' }}>
            <a href="/api/auth/google" style={{ fontSize:11, color:'#3b82f6', textDecoration:'none' }}>Connect Google Calendar</a>
          </div>
        )}
        <div style={{ position:'relative', overflow:'hidden' }}>
          {/* Time grid */}
          {ALL_SLOTS.map(s => <CalSlot key={`${s.h}:${s.m}`} slot={s} />)}

          {/* Current time red line */}
          {showLine && (
            <div style={{
              position:'absolute', left:0, right:0, top:lineTop,
              height:2, background:'#ef4444', zIndex:10, pointerEvents:'none',
              boxShadow:'0 0 3px rgba(239,68,68,0.5)',
            }}>
              <div style={{ position:'absolute', left:32, top:-4, width:10, height:10, borderRadius:'50%', background:'#ef4444' }} />
            </div>
          )}

          {/* Timed events — absolutely positioned with overlap columns */}
          {timedEvts.map(e => {
            const { colIdx, numCols } = getLayout(e)
            const isPast   = currentMins > e.eMins
            const visStart = Math.max(e.sMins, START_MINS)
            const visEnd   = Math.min(e.eMins, START_MINS + TOTAL_MINS)
            if (visStart >= visEnd) return null
            const topPx    = ((visStart - START_MINS) / 30) * SLOT_H + 1
            const heightPx = Math.max(SLOT_H - 3, ((visEnd - visStart) / 30) * SLOT_H - 2)
            const gap      = numCols > 1 ? 2 : 0
            return (
              <div key={e.id} style={{
                position:'absolute',
                top: topPx, height: heightPx,
                left:  `calc(38px + ${colIdx}     * (100% - 38px) / ${numCols} + ${colIdx > 0 ? gap : 0}px)`,
                width: `calc((100% - 38px) / ${numCols} - ${gap}px)`,
                background: e.color||'#1a73e8',
                borderRadius:3, overflow:'hidden', zIndex:2,
                display:'flex', alignItems:'flex-start',
                padding:'2px 6px',
                opacity: isPast ? 0.42 : 1,
              }}>
                <span style={{
                  fontSize:10, fontWeight:500, color:'#fff',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                }}>{e.title}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


// ── Add Task Modal ────────────────────────────────────────────────────

function AddTaskModal({ newTask, setNewTask, onAdd, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', borderRadius:14, padding:24, width:480, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#111', marginBottom:20 }}>Add new task</div>
        <div style={{ marginBottom:14 }}>
          <label style={labelSt}>Task name</label>
          <input autoFocus value={newTask.name} onChange={e=>setNewTask(p=>({...p,name:e.target.value}))}
            onKeyDown={e=>e.key==='Enter'&&onAdd()} placeholder="What needs to get done?" style={inputSt} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div><label style={labelSt}>Business</label>
            <select value={newTask.biz} onChange={e=>setNewTask(p=>({...p,biz:e.target.value}))} style={inputSt}>
              {Object.keys(BIZ).map(b=><option key={b}>{b}</option>)}
            </select></div>
          <div><label style={labelSt}>Horizon</label>
            <select value={newTask.horizon} onChange={e=>setNewTask(p=>({...p,horizon:e.target.value}))} style={inputSt}>
              {HORIZON_OPTS.map(h=><option key={h}>{h}</option>)}
            </select></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
          <div><label style={labelSt}>Due date</label>
            <input type="date" value={newTask.due} onChange={e=>setNewTask(p=>({...p,due:e.target.value}))} style={inputSt} /></div>
          <div><label style={labelSt}>Delegate to</label>
            <input value={newTask.delegate} onChange={e=>setNewTask(p=>({...p,delegate:e.target.value}))} placeholder="Optional" style={inputSt} /></div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:6, padding:'8px 18px', fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'#475569' }}>Cancel</button>
          <button onClick={onAdd} style={{ background:'#1e40af', border:'none', borderRadius:6, padding:'8px 18px', fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'#fff', fontWeight:500 }}>Add task</button>
        </div>
      </div>
    </div>
  )
}

// ── Do First ──────────────────────────────────────────────────────────

function DoFirst({ flagged, onUnflag, onSetStatus, onArchive }) {
  return (
    <div style={{ ...card, border:'1px solid #fecaca' }}>
      <div style={{ ...cardHead, background:'#fef2f2', borderBottom:'1px solid #fecaca', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ color:'#dc2626', fontWeight:500 }}>Do first</span>
          {flagged.length > 0 && <span style={{ background:'#fecaca', color:'#b91c1c', fontSize:10, padding:'0 6px', borderRadius:20 }}>{flagged.length}</span>}
        </div>
        {flagged.length > 0 && <span style={{ fontSize:9, color:'#fca5a5', fontWeight:400 }}>☑ complete & archive &nbsp;|&nbsp; × unflag only</span>}
      </div>
      {flagged.length === 0 ? (
        <div style={{ padding:'10px 14px', fontSize:11, color:'#bbb', textAlign:'center' }}>Go to <strong>Master list</strong> and click a grey flag to add tasks here</div>
      ) : (
        flagged.map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', borderBottom:'1px solid #fef2f2' }}>
            <input type="checkbox" onChange={() => onArchive(t.id)} title="Mark complete — moves to Archive"
              style={{ cursor:'pointer', width:14, height:14, accentColor:'#22c55e', flexShrink:0 }} />
            <StatusDropdown status={t.status} taskId={t.id} onSelect={onSetStatus} />
            <span style={{ flex:1, fontSize:12, fontWeight:500, color:'#111', marginLeft:4 }}>{t.name}</span>
            <span style={{ fontSize:11, color:t.overdue?'#dc2626':'#888', whiteSpace:'nowrap' }}>{t.due}</span>
            <button onClick={() => onUnflag(t.id)} title="Unflag — stays in your list"
              style={{ background:'none', border:'1px solid #fecaca', borderRadius:3, width:16, height:16, fontSize:9, cursor:'pointer', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
          </div>
        ))
      )}
    </div>
  )
}

// ── Task table ────────────────────────────────────────────────────────

function TaskTable({ tasks, mode, onCheckLeft, onSetStatus, onSetHorizon, onSetBiz, onSetDate, onArchive, editing, editVal, setEditVal, onStartEdit, onSaveEdit, onCancelEdit, sort, onSort, showDelegate=false, isMobile=false }) {
  const ep = { editing, editVal, setEditVal, onStart:onStartEdit, onSave:onSaveEdit, onCancel:onCancelEdit }
  const isMaster = mode === 'master'
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, width:32 }}></th>
            <SortTh label="Status" field="status" sort={sort} onSort={onSort} style={{ width:115 }} />
            <SortTh label="Task" field="name" sort={sort} onSort={onSort} />
            {!isMobile && <SortTh label="Business" field="biz" sort={sort} onSort={onSort} style={{ width:90 }} />}
            {!isMobile && <SortTh label="Horizon" field="horizon" sort={sort} onSort={onSort} style={{ width:120 }} />}
            <SortTh label="Due date" field="due" sort={sort} onSort={onSort} style={{ width:80 }} />
            {showDelegate && !isMobile && <SortTh label="Delegate" field="delegate" sort={sort} onSort={onSort} style={{ width:80 }} />}
            <th style={{ ...th, width:32 }}></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t,i) => (
            <tr key={t.id}
              style={{ background:t.flagged?'#fff7ed':(i%2===0?'#fff':'#fafafa') }}
              onMouseEnter={e=>e.currentTarget.style.background='#f0f4ff'}
              onMouseLeave={e=>e.currentTarget.style.background=t.flagged?'#fff7ed':(i%2===0?'#fff':'#fafafa')}
            >
              <td style={{ padding:'5px 8px' }}>
                {isMaster
                  ? <FlagBtn flagged={t.flagged} onClick={() => onCheckLeft(t.id)} />
                  : <input type="checkbox" onChange={() => onCheckLeft(t.id)} title="Mark complete — moves to Archive"
                      style={{ cursor:'pointer', width:13, height:13, accentColor:'#22c55e' }} />
                }
              </td>
              <td style={{ padding:'6px 8px' }}><StatusDropdown status={t.status} taskId={t.id} onSelect={onSetStatus} /></td>
              <td style={{ padding:'6px 10px', fontSize:12, fontWeight:500 }}>
                {t.overdue && <OverdueBadge />}
                <EditCell value={t.name} taskId={t.id} field="name" {...ep} inputStyle={{ width:240 }} spanStyle={{ color:t.overdue?'#b91c1c':'#111' }} />
                {t.flagged && <span style={{ fontSize:9, background:'#fef3c7', color:'#92400e', padding:'1px 5px', borderRadius:3, marginLeft:6 }}>do first</span>}
              </td>
              {!isMobile && <td style={{ padding:'6px 8px' }}><BizDropdown biz={t.biz} taskId={t.id} onSelect={onSetBiz} /></td>}
              {!isMobile && <td style={{ padding:'6px 8px' }}><HorizonDropdown horizon={t.horizon} taskId={t.id} onSelect={onSetHorizon} /></td>}
              <td style={{ padding:'6px 10px', fontSize:11 }}>
                <DateCell value={t.due} taskId={t.id} onSetDate={onSetDate}
                  spanStyle={{ color:t.overdue?'#dc2626':'#555', fontWeight:t.overdue?600:400 }} />
              </td>
              {showDelegate && !isMobile && (
                <td style={{ padding:'6px 10px', fontSize:11 }}>
                  <EditCell value={t.delegate} taskId={t.id} field="delegate" {...ep} inputStyle={{ width:80 }} spanStyle={{ color:'#555' }} />
                </td>
              )}
              <td style={{ padding:'5px 4px' }}><ArchiveXBtn onClick={() => onArchive(t.id)} /></td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr><td colSpan={8} style={{ padding:'20px', textAlign:'center', color:'#bbb', fontSize:12 }}>No tasks match this filter</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Archive table ─────────────────────────────────────────────────────

function ArchiveTable({ tasks, onRestore, onDelete }) {
  const [search, setSearch] = useState('')
  const filtered = search ? tasks.filter(t=>t.name.toLowerCase().includes(search.toLowerCase())) : tasks
  return (
    <div style={card}>
      <div style={{ ...cardHead, justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span>Archived: completed tasks</span>
          <span style={{ background:'#f1f5f9', color:'#94a3b8', fontSize:10, padding:'0 6px', borderRadius:20 }}>{tasks.length}</span>
        </div>
        <SearchInput value={search} onChange={setSearch} />
      </div>
      {filtered.length === 0 ? (
        <div style={{ padding:'24px', textAlign:'center', color:'#bbb', fontSize:12 }}>{tasks.length===0?'No completed tasks yet.':'No results.'}</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Task</th>
                <th style={{ ...th, width:90 }}>Business</th>
                <th style={{ ...th, width:70 }}>Due date</th>
                <th style={{ ...th, width:90 }}>Restore</th>
                <th style={{ ...th, width:110, color:'#dc2626' }}>Delete permanently</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t,i) => (
                <tr key={t.id} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                  <td style={{ padding:'7px 10px', fontSize:12, color:'#aaa', textDecoration:'line-through' }}>{t.name}</td>
                  <td style={{ padding:'7px 8px' }}>
                    <span style={{ background:BIZ[t.biz]?.bg||'#f1f5f9', color:BIZ[t.biz]?.color||'#475569', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500 }}>{t.biz}</span>
                  </td>
                  <td style={{ padding:'7px 10px', fontSize:11, color:'#bbb' }}>{t.due}</td>
                  <td style={{ padding:'7px 10px' }}>
                    <button onClick={() => onRestore(t.id)} style={{ background:'#eff6ff', color:'#1e40af', border:'none', borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>Restore</button>
                  </td>
                  <td style={{ padding:'7px 10px' }}>
                    <button onClick={() => { if (window.confirm('Permanently delete? Cannot be undone.')) onDelete(t.id) }}
                      style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Editable goals ────────────────────────────────────────────────────

function EditableGoals({ goals, setGoals }) {
  const [editIdx, setEditIdx] = useState(null)
  const [editVal, setEditVal] = useState('')
  const save = i => { if (editVal.trim()) setGoals(p=>p.map((g,idx)=>idx===i?editVal.trim():g)); setEditIdx(null) }
  return (
    <div style={{ padding:'8px 12px' }}>
      <div style={{ maxHeight:180, overflowY:'auto' }}>
        {goals.map((g,i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'5px 0', borderBottom:i<goals.length-1?'1px solid #f5f5f5':'none' }}>
            <span style={{ width:17, height:17, borderRadius:4, background:'#e0f2fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:600, color:'#0369a1', flexShrink:0 }}>{i+1}</span>
            {editIdx===i ? (
              <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                onBlur={()=>save(i)} onKeyDown={e=>{if(e.key==='Enter')save(i);if(e.key==='Escape')setEditIdx(null)}}
                style={{ flex:1, ...editInp, fontSize:12 }} />
            ) : (
              <span onClick={() => { setEditIdx(i); setEditVal(g) }} style={{ flex:1, fontSize:12, color:'#1a1a1a', lineHeight:1.4, cursor:'text' }} title="Click to edit">{g}</span>
            )}
            <button onClick={() => setGoals(p=>p.filter((_,idx)=>idx!==i))}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#e2e8f0', fontSize:14, padding:'0 2px', lineHeight:1 }}
              onMouseEnter={e=>e.currentTarget.style.color='#dc2626'}
              onMouseLeave={e=>e.currentTarget.style.color='#e2e8f0'}>×</button>
          </div>
        ))}
      </div>
      <button onClick={() => { const i=goals.length; setGoals(p=>[...p,'New goal']); setEditIdx(i); setEditVal('New goal') }}
        style={{ marginTop:8, background:'none', border:'1px dashed #bae6fd', borderRadius:6, padding:'4px 10px', fontSize:11, color:'#7dd3fc', cursor:'pointer', width:'100%', fontFamily:'inherit' }}>
        + Add goal
      </button>
    </div>
  )
}

function CrossFitCountdown() {
  const days = daysUntil(GAMES_DATE)
  return (
    <div style={{ background:'#0f172a', borderRadius:12, border:'1px solid #1e3a5f' }}>
      <div style={{ padding:'14px 16px', textAlign:'center' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'#84cc16', letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>CrossFit Games</div>
        <div style={{ fontSize:64, fontWeight:700, color:'#84cc16', lineHeight:1 }}>{days}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>days away</div>
        <div style={{ marginTop:10, fontSize:11, color:'rgba(255,255,255,0.5)', fontStyle:'italic' }}>Hard work pays off</div>
      </div>
    </div>
  )
}

function MindsetCard() {
  const [mindset, setMindset] = useState('Lead the team with confidence and clarity.')
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    fetch('/api/settings/mindset').then(r=>r.json())
      .then(d => { if (d.value) setMindset(d.value) }).catch(()=>{})
  }, [])

  const persist = val => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetch('/api/settings/mindset', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ value:val }) }).catch(()=>{})
    }, 1000)
  }
  const startEdit   = () => { setDraft(mindset); setEditing(true) }
  const confirmEdit = () => { persist(draft); setMindset(draft); setEditing(false) }
  const cancelEdit  = () => setEditing(false)

  return (
    <div style={{
      background:'#fff', borderRadius:12,
      border:'1px solid #e5e7eb',
      borderLeft:'4px solid #f59e0b',
      overflow:'hidden',
    }}>
      <div style={{ padding:'18px 18px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:9, fontWeight:600, color:'#9ca3af', letterSpacing:1.5, textTransform:'uppercase' }}>
            Today's intention
          </span>
          {!editing && (
            <button onClick={startEdit} title="Edit"
              style={{ background:'none', border:'none', cursor:'pointer', color:'#d1d5db', fontSize:14, padding:0, lineHeight:1 }}
              onMouseEnter={e=>e.currentTarget.style.color='#f59e0b'}
              onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}>✎</button>
          )}
        </div>
        {editing ? (
          <div>
            <textarea autoFocus value={draft} onChange={e=>setDraft(e.target.value)} rows={3}
              style={{ width:'100%', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:6,
                padding:'10px 12px', fontSize:13, fontFamily:'inherit', color:'#78350f',
                resize:'none', lineHeight:1.6, boxSizing:'border-box' }} />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:6, marginTop:10 }}>
              <button onClick={cancelEdit}
                style={{ background:'transparent', border:'1px solid #e5e7eb', borderRadius:6,
                  padding:'5px 14px', fontSize:11, color:'#6b7280', cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={confirmEdit}
                style={{ background:'#f59e0b', border:'none', borderRadius:6,
                  padding:'5px 14px', fontSize:11, color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize:16, color:'#92400e', fontStyle:'italic', lineHeight:1.65, letterSpacing:0.3 }}>
            "{mindset}"
          </div>
        )}
      </div>
    </div>
  )
}

function RightPanel({ tasks, goals, setGoals, syncing }) {

  const open = tasks.filter(t=>t.status!=='done')
  const stats = [
    { label:'Overdue',     value:open.filter(t=>t.overdue).length,              color:'#dc2626' },
    { label:'In progress', value:open.filter(t=>t.status==='doing').length,      color:'#2563eb' },
    { label:'This week',   value:open.filter(t=>t.horizon==='This Week').length, color:'#d97706' },
    { label:'Total open',  value:open.length,                                    color:'#6b7280' },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <MindsetCard />
      <CrossFitCountdown />
      <div style={card}>
        <div style={cardHead}>Focus goals and projects</div>
        <EditableGoals goals={goals} setGoals={setGoals} />
      </div>
      <div style={card}>
        <div style={{ ...cardHead, justifyContent:'space-between' }}>
          <span>Today at a glance</span>
          {syncing && <span style={{ fontSize:9, color:'#94a3b8' }}>saving...</span>}
        </div>
        <div style={{ padding:'10px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background:'#f8fafc', borderRadius:8, padding:'6px 4px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:500, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:9, color:'#94a3b8', marginTop:1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export default function App() {
  const [view,         setView]         = useState('daily')
  const [showAdd,      setShowAdd]      = useState(false)
  const [newTask,      setNewTask]      = useState({ name:'', biz:'Hush', horizon:'This Week', due:'', delegate:'' })
  const [editing,      setEditing]      = useState(null)
  const [editVal,      setEditVal]      = useState('')
  const [filterView,   setFilterView]   = useState('all')
  const [filterBiz,    setFilterBiz]    = useState('All')
  const [sort,         setSort]         = useState({ field:'due', dir:'asc' })
  const [dailySearch,  setDailySearch]  = useState('')
  const [masterSearch, setMasterSearch] = useState('')
  const [tasks,        setTasks]        = useState([])
  const [goals,        setGoals]        = useState(DEFAULT_GOALS)
  const [loading,      setLoading]      = useState(true)
  const [syncing,      setSyncing]      = useState(false)
  const [error,        setError]        = useState(null)
  const isMobile = useIsMobile()
  const taskSyncRef = useRef(null)
  const goalSyncRef = useRef(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then(r=>r.json()),
      fetch('/api/goals').then(r=>r.json()),
    ]).then(([tasksData, goalsData]) => {
      setTasks(recalcOverdue(tasksData))
      if (goalsData.length > 0) setGoals(goalsData)
      setLoading(false)
    }).catch(err => {
      setError('Cannot connect to Hank backend. Make sure the server is running.')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (loading) return
    clearTimeout(taskSyncRef.current)
    setSyncing(true)
    taskSyncRef.current = setTimeout(() => {
      fetch('/api/tasks/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(tasks) })
        .then(() => setSyncing(false)).catch(() => setSyncing(false))
    }, SYNC_DELAY)
  }, [tasks])

  useEffect(() => {
    if (loading) return
    clearTimeout(goalSyncRef.current)
    goalSyncRef.current = setTimeout(() => {
      fetch('/api/goals/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(goals) }).catch(()=>{})
    }, SYNC_DELAY)
  }, [goals])

  const toggleFlag    = id => setTasks(p=>p.map(t=>t.id===id?{...t,flagged:!t.flagged}:t))
  const deleteTask    = id => setTasks(p=>p.filter(t=>t.id!==id))
  const setTaskStatus = (id,s) => setTasks(p=>p.map(t=>t.id!==id?t:{...t,status:s}))
  const setTaskHorizon= (id,h) => setTasks(p=>p.map(t=>t.id!==id?t:{...t,horizon:h}))
  const setTaskBiz    = (id,b) => setTasks(p=>p.map(t=>t.id!==id?t:{...t,biz:b}))
  const setTaskDate   = (id,ds) => setTasks(p=>p.map(t=>t.id!==id?t:{...t,due:formatDueDate(ds),overdue:checkOverdue(ds)}))
  const restoreTask   = id => setTasks(p=>p.map(t=>t.id!==id?t:{...t,status:'todo'}))
  const archiveTask   = id => setTasks(p=>p.map(t=>t.id!==id?t:{...t,status:'done',flagged:false}))

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ tasks, goals, exported: new Date().toISOString() }, null, 2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=`hank-backup-${new Date().toISOString().split('T')[0]}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.tasks) {
          const fixed = recalcOverdue(data.tasks)
          await fetch('/api/tasks/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(fixed) })
          setTasks(fixed)
        }
        if (data.goals?.length > 0) {
          await fetch('/api/goals/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data.goals) })
          setGoals(data.goals)
        }
        alert(`Imported ${data.tasks?.length||0} tasks successfully.`)
      } catch (err) { alert('Import failed: ' + err.message) }
    }
    reader.readAsText(file)
  }

  const addTask = () => {
    if (!newTask.name.trim()) return
    const id = Math.max(0,...tasks.map(t=>t.id)) + 1
    const due = newTask.due ? formatDueDate(newTask.due) : ''
    const overdue = newTask.due ? checkOverdue(newTask.due) : false
    setTasks(p=>[...p,{id,status:'todo',flagged:false,added:'',overdue,name:newTask.name,biz:newTask.biz,horizon:newTask.horizon,due,delegate:newTask.delegate}])
    setNewTask({ name:'', biz:'Hush', horizon:'This Week', due:'', delegate:'' })
    setShowAdd(false)
  }

  const startEdit  = (id,f,v) => { setEditing({id,field:f}); setEditVal(v||'') }
  const cancelEdit = () => { setEditing(null); setEditVal('') }
  const saveEdit   = () => {
    if (!editing) return
    setTasks(p=>p.map(t=>t.id!==editing.id?t:{...t,[editing.field]:editVal}))
    setEditing(null); setEditVal('')
  }
  const toggleSort = f => setSort(p=>p.field===f?{field:f,dir:p.dir==='asc'?'desc':'asc'}:{field:f,dir:'asc'})
  const applySort = list => {
    if (!sort.field) return list
    return [...list].sort((a,b) => {
      const av = sort.field==='due'?(toDatInput(a.due)||'9999'):((a[sort.field]||'')+'').toLowerCase()
      const bv = sort.field==='due'?(toDatInput(b.due)||'9999'):((b[sort.field]||'')+'').toLowerCase()
      return sort.dir==='asc'?av.localeCompare(bv):bv.localeCompare(av)
    })
  }

  const open     = tasks.filter(t=>t.status!=='done')
  const archived = tasks.filter(t=>t.status==='done')
  const flagged  = open.filter(t=>t.flagged)
  const dailyBase = open.filter(t=>!t.flagged&&(t.overdue||dueWithinDays(t.due,DAYS_AHEAD)))
  const dailyTasks = applySort(dailySearch ? dailyBase.filter(t=>t.name.toLowerCase().includes(dailySearch.toLowerCase())) : dailyBase)
  const masterBase = applySort((() => {
    let r = open
    if (filterBiz!=='All') r = r.filter(t=>t.biz===filterBiz)
    if (filterView==='week') r = r.filter(t=>t.horizon==='This Week')
    else if (filterView==='month') r = r.filter(t=>t.horizon==='This Month')
    else if (filterView==='quarter') r = r.filter(t=>t.horizon==='This Quarter')
    if (masterSearch) r = r.filter(t=>t.name.toLowerCase().includes(masterSearch.toLowerCase()))
    return r
  })())

  const sharedProps = {
    onSetStatus:setTaskStatus, onSetHorizon:setTaskHorizon, onSetBiz:setTaskBiz,
    onSetDate:setTaskDate, onArchive:archiveTask,
    editing, editVal, setEditVal, onStartEdit:startEdit, onSaveEdit:saveEdit, onCancelEdit:cancelEdit,
    sort, onSort:toggleSort,
  }

  const tabBtn = (id, label, badge=0) => (
    <button key={id} onClick={()=>setView(id)} style={{
      background:view===id?'rgba(255,255,255,0.15)':'transparent',
      border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, padding:'5px 14px',
      fontSize:12, fontWeight:view===id?500:400, color:view===id?'#fff':'rgba(255,255,255,0.45)',
      cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5,
    }}>
      {label}{badge>0&&<span style={{ background:'rgba(255,255,255,0.15)', fontSize:10, padding:'0 5px', borderRadius:10 }}>{badge}</span>}
    </button>
  )

  if (loading) return (
    <div style={{ background:'#0f0f0f', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'#fff' }}>
        <div style={{ fontSize:32, fontWeight:600, letterSpacing:4, marginBottom:16 }}>HANK</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Loading your tasks...</div>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ background:'#0f0f0f', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'#fff', maxWidth:400 }}>
        <div style={{ fontSize:32, fontWeight:600, letterSpacing:4, marginBottom:16 }}>HANK</div>
        <div style={{ color:'#f87171', fontSize:13, marginBottom:8 }}>{error}</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>Run: node server/server.js</div>
      </div>
    </div>
  )

  return (
    <div style={{ background:'#0f0f0f', minHeight:'100vh', padding: isMobile ? 0 : 16, boxSizing:'border-box' }}>
      {isMobile && (
      <button onClick={() => setShowAdd(true)} aria-label="Add task" style={{
        position:'fixed', bottom:24, right:20, zIndex:200,
        width:62, height:62, borderRadius:'50%',
        background:'#1e40af', border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:34, color:'#fff', fontWeight:300, lineHeight:1,
        boxShadow:'0 4px 20px rgba(30,64,175,0.55)', userSelect:'none',
      }}>+</button>
    )}
    {showAdd && <AddTaskModal newTask={newTask} setNewTask={setNewTask} onAdd={addTask} onClose={()=>setShowAdd(false)} />}
      <div style={{ maxWidth:1600, margin:'0 auto' }}>
        {isMobile ? (
          <div style={{ position:'sticky', top:0, zIndex:100, background:'#0f0f0f', padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:24, fontWeight:600, letterSpacing:3, color:'#fff' }}>HANK</span>
              <div style={{ marginLeft:'auto', display:'flex', gap:3 }}>
                {tabBtn('daily','Daily')}{tabBtn('master','Master')}{tabBtn('archive','Archive',archived.length)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:16, paddingBottom:14, marginBottom:14, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize:32, fontWeight:600, letterSpacing:4, color:'#fff' }}>HANK</span>
            <span style={{ fontSize:13, color:'#fff', opacity:0.7 }}>{getToday()}</span>
            <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
              {tabBtn('daily','Daily view')}{tabBtn('master','Master list')}{tabBtn('archive','Archive',archived.length)}
            </div>
            <button onClick={exportData} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'5px 12px', fontSize:11, color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit' }}>Export</button>
            <label style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'5px 12px', fontSize:11, color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit' }}>
              Import<input type="file" accept=".json" onChange={e=>e.target.files[0]&&importData(e.target.files[0])} style={{ display:'none' }} />
            </label>
            <button onClick={()=>setShowAdd(true)} style={{ background:'#1e40af', border:'none', borderRadius:6, padding:'6px 16px', fontSize:12, color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>+ Add task</button>
          </div>
        )}

        {view==='master' && <MasterFilterBar filterView={filterView} setFilterView={setFilterView} filterBiz={filterBiz} setFilterBiz={setFilterBiz} />}

        <div style={isMobile ? { padding:'12px 16px 96px' } : {}}>
        {view==='daily' && (isMobile ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <DoFirst flagged={flagged} onUnflag={toggleFlag} onSetStatus={setTaskStatus} onArchive={archiveTask} />
            <div style={card}>
              <div style={{ ...cardHead, flexWrap:'wrap' }}>
                <span>Today's tasks</span>
                <span style={{ background:'#f1f5f9', color:'#94a3b8', fontSize:10, padding:'0 6px', borderRadius:20 }}>{dailyTasks.length}</span>
                <div style={{ marginLeft:'auto' }}><SearchInput value={dailySearch} onChange={setDailySearch} /></div>
              </div>
              <TaskTable tasks={dailyTasks} mode="daily" onCheckLeft={archiveTask} {...sharedProps} showDelegate={false} isMobile={true} />
            </div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'310px 1fr 280px', gap:14, alignItems:'start' }}>
            <div style={{ position:'sticky', top:16 }}><Calendar /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <DoFirst flagged={flagged} onUnflag={toggleFlag} onSetStatus={setTaskStatus} onArchive={archiveTask} />
              <div style={card}>
                <div style={{ ...cardHead, flexWrap:'wrap' }}>
                  <span>Today's tasks</span>
                  <span style={{ background:'#f1f5f9', color:'#94a3b8', fontSize:10, padding:'0 6px', borderRadius:20 }}>{dailyTasks.length}</span>
                  <span style={{ fontSize:10, color:'#bbb', fontWeight:400 }}>Overdue + due within {DAYS_AHEAD} days</span>
                  <div style={{ marginLeft:'auto' }}><SearchInput value={dailySearch} onChange={setDailySearch} /></div>
                </div>
                <TaskTable tasks={dailyTasks} mode="daily" onCheckLeft={archiveTask} {...sharedProps} showDelegate={false} />
              </div>
            </div>
            <div style={{ position:'sticky', top:16 }}><RightPanel tasks={tasks} goals={goals} setGoals={setGoals} syncing={syncing} /></div>
          </div>
        ))}

        {view==='master' && (
          <div style={card}>
            <div style={{ ...cardHead, justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span>Master tasks</span>
                <span style={{ background:'#f1f5f9', color:'#94a3b8', fontSize:10, padding:'0 6px', borderRadius:20 }}>{masterBase.length}</span>
                <span style={{ fontSize:10, color:'#bbb', fontWeight:400 }}>Flag = Do first &nbsp;|&nbsp; × = archive</span>
              </div>
              <SearchInput value={masterSearch} onChange={setMasterSearch} />
            </div>
            <TaskTable tasks={masterBase} mode="master" onCheckLeft={toggleFlag} {...sharedProps} showDelegate={true} isMobile={isMobile} />
          </div>
        )}

        {view==='archive' && <ArchiveTable tasks={archived} onRestore={restoreTask} onDelete={deleteTask} />}
      </div>
    </div>
  )
}
