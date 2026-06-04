import { useState, useEffect } from 'react'

const TODAY = 'Wednesday, June 3, 2026'

const BIZ = {
  'Hush':         { bg: '#dbeafe', color: '#1e40af' },
  'Ashley':       { bg: '#ffedd5', color: '#c2410c' },
  'Liquor Store': { bg: '#fee2e2', color: '#b91c1c' },
  'Rusty Bear':   { bg: '#fef3c7', color: '#78350f' },
  'CrossFit':     { bg: '#dcfce7', color: '#166534' },
  'Personal':     { bg: '#f3e8ff', color: '#7e22ce' },
  'Comm. RE':     { bg: '#e0e7ff', color: '#3730a3' },
  'Land Dev':     { bg: '#e2e8f0', color: '#475569' },
  'DBA':          { bg: '#fef9c3', color: '#854d0e' },
  'DC':           { bg: '#ccfbf1', color: '#0f766e' },
}

const STATUS = {
  todo:  { dot: '#94a3b8', label: 'Not started' },
  doing: { dot: '#3b82f6', label: 'In progress' },
  done:  { dot: '#22c55e', label: 'Done' },
}

const PILL = {
  todo:  { bg: '#f1f5f9', color: '#64748b' },
  doing: { bg: '#eff6ff', color: '#1d4ed8' },
  done:  { bg: '#f0fdf4', color: '#15803d' },
}

const INITIAL_TASKS = [
  { id:1, status:'todo', name:'Geoff - Follow up Call', biz:'Hush', horizon:'This Week', added:'', due:'Jun 4', overdue:false, delegate:'' },
  { id:2, status:'doing', name:'Book high point accommodations', biz:'Hush', horizon:'This Week', added:'', due:'May 23', overdue:true, delegate:'' },
  { id:3, status:'todo', name:'Call Art of skin re: appointments', biz:'Personal', horizon:'This Week', added:'', due:'May 16', overdue:true, delegate:'' },
  { id:4, status:'todo', name:'Jag - follow up (primo & Fine Home)', biz:'Hush', horizon:'This Week', added:'', due:'May 21', overdue:true, delegate:'' },
  { id:5, status:'todo', name:'Nathan - June Mondays OFF??', biz:'Hush', horizon:'This Week', added:'', due:'May 23', overdue:true, delegate:'' },
  { id:6, status:'todo', name:'Call Dr Lubitz reschedule appointment', biz:'Personal', horizon:'This Week', added:'', due:'May 23', overdue:true, delegate:'' },
  { id:7, status:'todo', name:'Call Tree Trimmer for house', biz:'Personal', horizon:'This Week', added:'', due:'May 23', overdue:true, delegate:'' },
  { id:8, status:'todo', name:'Quality stock order - new stains?', biz:'Hush', horizon:'This Week', added:'', due:'May 23', overdue:true, delegate:'' },
  { id:9, status:'todo', name:'HOCH logo redesign', biz:'Hush', horizon:'This Week', added:'', due:'May 23', overdue:true, delegate:'' },
  { id:10, status:'todo', name:'Set up an appointment with Graham Lehman @ Creekside', biz:'Personal', horizon:'This Week', added:'', due:'May 24', overdue:true, delegate:'' },
  { id:11, status:'todo', name:'Follow up with Archdesigns on cabinetry.', biz:'Hush', horizon:'This Week', added:'', due:'May 25', overdue:true, delegate:'' },
  { id:12, status:'todo', name:'Order Restwell Zara RVQ x2, Theadora doubles', biz:'Hush', horizon:'This Week', added:'', due:'May 25', overdue:true, delegate:'' },
  { id:13, status:'todo', name:'Write Ashley Radio', biz:'Ashley', horizon:'This Week', added:'', due:'May 27', overdue:true, delegate:'' },
  { id:14, status:'todo', name:'Order Samsung OTRs', biz:'Hush', horizon:'This Month', added:'', due:'May 30', overdue:true, delegate:'Brendon' },
  { id:15, status:'todo', name:'Create a Rendering of Canvas structure at Ashley', biz:'Ashley', horizon:'This Month', added:'', due:'May 30', overdue:true, delegate:'' },
  { id:16, status:'todo', name:'Solution for Roof leak at 338', biz:'Comm. RE', horizon:'This Month', added:'', due:'May 30', overdue:true, delegate:'' },
  { id:17, status:'todo', name:'Ashley 1on1 meetings with sales team', biz:'Ashley', horizon:'This Month', added:'', due:'May 30', overdue:true, delegate:'' },
  { id:18, status:'todo', name:'Premium Appliance Display - Jenair Wolf Sub Zero GE Cafe Monogram', biz:'Hush', horizon:'This Week', added:'', due:'May 30', overdue:true, delegate:'' },
  { id:19, status:'todo', name:'Insure MotorBike', biz:'Personal', horizon:'This Month', added:'', due:'May 30', overdue:true, delegate:'' },
  { id:20, status:'todo', name:'Archsynth AI software', biz:'Hush', horizon:'This Month', added:'', due:'May 30', overdue:true, delegate:'' },
  { id:21, status:'todo', name:'Website - LZB Chair layout', biz:'Hush', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:22, status:'todo', name:'Blinds - Skyler Dalum 250-919-2288', biz:'Hush', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:23, status:'todo', name:'Update Lease for Kendall', biz:'Comm. RE', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:24, status:'todo', name:'Order a new computer for Brendon', biz:'Hush', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:25, status:'todo', name:'Create new logo for Liquor Store', biz:'Liquor Store', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:26, status:'todo', name:'Canvas structure quote', biz:'Ashley', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:27, status:'todo', name:'Triangular Toblerone Sale mattress talker', biz:'Hush', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:28, status:'todo', name:'Facebook custom & look-alike audience', biz:'Hush', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:29, status:'todo', name:'Stone Ridge Estates logo', biz:'Land Dev', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:30, status:'todo', name:'Compactor Switch', biz:'Liquor Store', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:31, status:'todo', name:'Checkit / Facebook integration issues', biz:'Hush', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:32, status:'todo', name:'iPad 2nd tablet set up', biz:'Personal', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:33, status:'todo', name:'Review land agreement', biz:'Land Dev', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:34, status:'todo', name:'Rusty Bear Wallball Targets', biz:'Rusty Bear', horizon:'This Month', added:'', due:'May 31', overdue:true, delegate:'' },
  { id:35, status:'todo', name:'Set up Marketing meeting with Christine from dRSG', biz:'Hush', horizon:'This Week', added:'', due:'Jun 1', overdue:true, delegate:'' },
  { id:36, status:'todo', name:'Book Doctors app - prescriptions Jublia/Diclo Hormones', biz:'Personal', horizon:'This Week', added:'', due:'Jun 6', overdue:false, delegate:'' },
  { id:37, status:'todo', name:'Call Billy at Quality 604.644.0867', biz:'Hush', horizon:'This Week', added:'', due:'Jun 6', overdue:false, delegate:'' },
  { id:38, status:'todo', name:'Optimize Website so we come up on AI searches', biz:'Hush', horizon:'This Week', added:'', due:'Jun 6', overdue:false, delegate:'' },
  { id:39, status:'todo', name:'Assess dRSG container product for fall', biz:'Hush', horizon:'This Month', added:'', due:'Jun 6', overdue:false, delegate:'' },
  { id:40, status:'todo', name:'Create a Marketing Agent', biz:'Hush', horizon:'This Week', added:'', due:'Jun 13', overdue:false, delegate:'' },
  { id:41, status:'todo', name:'Call Karam from King Eddie', biz:'Liquor Store', horizon:'This Month', added:'', due:'Jun 13', overdue:false, delegate:'' },
  { id:42, status:'todo', name:'Where to buy Celiant Mattress protectors', biz:'Hush', horizon:'This Month', added:'', due:'Jun 20', overdue:false, delegate:'' },
  { id:43, status:'todo', name:'Create a sales training AI - bring in sales & Mark training docs', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 20', overdue:false, delegate:'' },
  { id:44, status:'todo', name:'Rotary CrossFit presentation', biz:'Personal', horizon:'This Month', added:'', due:'Jun 25', overdue:false, delegate:'' },
  { id:45, status:'todo', name:'Order a second open sign for Ashley - right side window', biz:'Ashley', horizon:'This Month', added:'', due:'Jun 27', overdue:false, delegate:'Zack' },
  { id:46, status:'todo', name:'Order rain bells for tents down in Ashley', biz:'Ashley', horizon:'This Month', added:'', due:'Jun 27', overdue:false, delegate:'' },
  { id:47, status:'todo', name:'New Claude Project - Hush Sales expert', biz:'Hush', horizon:'This Month', added:'', due:'Jun 27', overdue:false, delegate:'' },
  { id:48, status:'todo', name:'Set Up Projects in Notion - ie Hush Reno', biz:'Hush', horizon:'This Month', added:'', due:'Jun 27', overdue:false, delegate:'' },
  { id:49, status:'todo', name:'Summer Staff Party', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 27', overdue:false, delegate:'' },
  { id:50, status:'todo', name:'Look into side entry containers for DC - Big Al?', biz:'DC', horizon:'This Month', added:'', due:'Jun 27', overdue:false, delegate:'' },
  { id:51, status:'todo', name:'Add more garbage cans to downtown Cranbrook', biz:'DBA', horizon:'This Quarter', added:'', due:'Jun 27', overdue:false, delegate:'' },
  { id:52, status:'todo', name:'Order a new tent for Ashley', biz:'Ashley', horizon:'This Month', added:'', due:'Jun 27', overdue:false, delegate:'' },
  { id:53, status:'todo', name:'Set up Eli with a Dropbox account', biz:'Personal', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:54, status:'todo', name:'Clean out lean-to and remove all garbage', biz:'Personal', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:55, status:'todo', name:'Replace front door handle', biz:'Personal', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:56, status:'todo', name:'Dropbox Photo Cleanse', biz:'Personal', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:57, status:'todo', name:'Sunco - move camera down add one upstairs', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:58, status:'todo', name:'Paint the La-z-Boy wall blue', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:59, status:'todo', name:'Procedure: Staff Performance Review Document', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:60, status:'todo', name:'Fix loading dock - back of store', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:61, status:'todo', name:'Security system for Hush offices', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:62, status:'todo', name:'Policy document: Salesperson leaving', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:63, status:'todo', name:'Extend Price Increase Review', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:64, status:'todo', name:'Review Extend Expenses with Service Team', biz:'DC', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:65, status:'todo', name:'Revise bonus and KPI analysis', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:66, status:'todo', name:'Mike Sommer - fix range in apartment', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:67, status:'todo', name:'George Monthly Booze Analysis', biz:'Liquor Store', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:68, status:'todo', name:'Blue Truck Billboard Artwork', biz:'DC', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:69, status:'todo', name:'338 Poll Sign', biz:'Comm. RE', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:70, status:'todo', name:'Update Peak Security', biz:'Hush', horizon:'This Quarter', added:'', due:'Jun 30', overdue:false, delegate:'' },
  { id:71, status:'todo', name:'Do my boating licence', biz:'Personal', horizon:'Someday', added:'', due:'', overdue:false, delegate:'' },
  { id:72, status:'todo', name:'Look into Zoho CRM', biz:'Hush', horizon:'Someday', added:'', due:'', overdue:false, delegate:'' },
  { id:73, status:'todo', name:'Look into solar for the liquor store', biz:'Liquor Store', horizon:'Someday', added:'', due:'', overdue:false, delegate:'' },
  { id:74, status:'todo', name:'Arthur Carpet Box', biz:'Hush', horizon:'Someday', added:'', due:'', overdue:false, delegate:'' },
  { id:75, status:'todo', name:'Order more dish displays for Hush x5', biz:'Hush', horizon:'This Month', added:'', due:'Jun 27', overdue:false, delegate:'' },
]

const MORNING   = ['6:00','6:30 AM','7:00','7:30','8:00','8:30','9:00','9:30','10:00','10:30','11:00','11:30','12:00']
const AFTERNOON = ['12:30','1:00','1:30','2:00','2:30','3:00','3:30','4:00','4:30','5:00','5:30','6:00','6:30']

const APPTS = {
  '6:30 AM': { label: 'Swim',       bg: '#1a73e8' },
  '8:30':    { label: 'Dr. Beavan', bg: '#8e24aa' },
  '5:00':    { label: 'Lacrosse',   bg: '#f4511e' },
}

const GOALS = [
  'CrossFit Quarterfinals prep',
  'Premium Appliance Gallery launch',
  'Stone Ridge Estates',
]

const card = {
  background: '#ffffff',
  borderRadius: 12,
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
}

const cardHead = {
  padding: '8px 14px',
  borderBottom: '1px solid #f0f0f0',
  fontSize: 11,
  fontWeight: 500,
  color: '#888',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
}

const th = {
  textAlign: 'left',
  padding: '6px 10px',
  fontSize: 10,
  fontWeight: 500,
  color: '#bbb',
  borderBottom: '1px solid #f0f0f0',
}

function BizTag({ biz }) {
  const c = BIZ[biz] || { bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{ background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {biz}
    </span>
  )
}

function StatusDot({ status, onClick }) {
  const color = STATUS[status]?.dot || '#94a3b8'
  const label = STATUS[status]?.label || 'Not started'
  return (
    <button onClick={onClick} title={label} style={{ width: 11, height: 11, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer', flexShrink: 0, display: 'inline-block' }} />
  )
}

function StatusPill({ status, onClick }) {
  const s = STATUS[status] || STATUS.todo
  const p = PILL[status] || PILL.todo
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: p.bg, color: p.color, border: 'none', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </button>
  )
}

function HorizonTag({ horizon }) {
  const styles = {
    'This Week':    { bg: '#fef3c7', color: '#92400e' },
    'This Month':   { bg: '#ede9fe', color: '#5b21b6' },
    'This Quarter': { bg: '#dcfce7', color: '#166534' },
    'Someday':      { bg: '#f1f5f9', color: '#64748b' },
  }
  const s = styles[horizon] || styles['Someday']
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {horizon}
    </span>
  )
}

function OverdueBadge() {
  return (
    <span style={{ fontSize: 9, background: '#fee2e2', color: '#dc2626', padding: '1px 4px', borderRadius: 3, marginRight: 5, fontWeight: 600 }}>
      overdue
    </span>
  )
}

function CalSlot({ time }) {
  const appt = APPTS[time]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #f5f5f5', minHeight: 22, padding: '1px 0' }}>
      <span style={{ fontSize: 10, color: '#c0c0c0', width: 36, flexShrink: 0 }}>{time}</span>
      {appt && (
        <span style={{ fontSize: 10, fontWeight: 500, color: '#fff', background: appt.bg, padding: '1px 7px', borderRadius: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {appt.label}
        </span>
      )}
    </div>
  )
}

function Calendar() {
  return (
    <div style={card}>
      <div style={cardHead}>Today's schedule</div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#c0c0c0', letterSpacing: 0.5, marginBottom: 4 }}>MORNING</div>
        {MORNING.map(t => <CalSlot key={t} time={t} />)}
        <div style={{ height: 8 }} />
        <div style={{ fontSize: 9, fontWeight: 600, color: '#c0c0c0', letterSpacing: 0.5, margin: '4px 0' }}>AFTERNOON</div>
        {AFTERNOON.map(t => <CalSlot key={t} time={t} />)}
      </div>
    </div>
  )
}

function DoFirst({ flagged, onRemove, onCycle }) {
  return (
    <div style={{ ...card, border: '1px solid #fecaca' }}>
      <div style={{ ...cardHead, background: '#fef2f2', color: '#dc2626', borderBottom: '1px solid #fecaca' }}>
        <span>Do first</span>
        {flagged.length > 0 && (
          <span style={{ background: '#fecaca', color: '#b91c1c', fontSize: 10, padding: '0 6px', borderRadius: 20 }}>{flagged.length}</span>
        )}
      </div>
      {flagged.length === 0 ? (
        <div style={{ padding: '10px 14px', fontSize: 11, color: '#bbb', textAlign: 'center' }}>
          Go to <strong>Master list</strong> and check a task to flag it here
        </div>
      ) : (
        flagged.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderBottom: '1px solid #fef2f2' }}>
            <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 3, width: 16, height: 16, fontSize: 9, cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>x</button>
            <StatusDot status={t.status} onClick={() => onCycle(t.id)} />
            <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#111' }}>{t.name}</span>
            <BizTag biz={t.biz} />
            <span style={{ fontSize: 11, color: t.overdue ? '#dc2626' : '#666', fontWeight: t.overdue ? 600 : 400 }}>{t.overdue ? '! ' : ''}{t.due}</span>
          </div>
        ))
      )}
    </div>
  )
}

function DailyTable({ tasks, onFlag, onCycle }) {
  return (
    <div style={card}>
      <div style={{ ...cardHead, justifyContent: 'flex-start', gap: 8 }}>
        Today's tasks
        <span style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: 10, padding: '0 6px', borderRadius: 20 }}>{tasks.length}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 28 }}></th>
              <th style={{ ...th, width: 20 }}></th>
              <th style={th}>Task</th>
              <th style={th}>Business</th>
              <th style={{ ...th, whiteSpace: 'nowrap' }}>Due date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr key={t.id}
                style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
              >
                <td style={{ padding: '7px 10px' }}>
                  <input type="checkbox" checked={t.flagged} onChange={() => onFlag(t.id)} style={{ cursor: 'pointer', width: 13, height: 13, accentColor: '#dc2626' }} />
                </td>
                <td style={{ padding: '7px 4px' }}>
                  <StatusDot status={t.status} onClick={() => onCycle(t.id)} />
                </td>
                <td style={{ padding: '7px 10px', fontSize: 12, fontWeight: 500, color: t.overdue ? '#b91c1c' : '#111' }}>
                  {t.overdue && <OverdueBadge />}{t.name}
                </td>
                <td style={{ padding: '7px 10px' }}><BizTag biz={t.biz} /></td>
                <td style={{ padding: '7px 10px', fontSize: 11, color: t.overdue ? '#dc2626' : '#555', fontWeight: t.overdue ? 600 : 400, whiteSpace: 'nowrap' }}>{t.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MasterTable({ tasks, onFlag, onCycle }) {
  return (
    <div style={card}>
      <div style={{ ...cardHead, justifyContent: 'space-between' }}>
        <span>Master tasks: everything I'm working on</span>
        <span style={{ fontSize: 10, fontWeight: 400, color: '#bbb' }}>Check to flag for Do first</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 28 }}></th>
              <th style={{ ...th, width: 100 }}>Status</th>
              <th style={th}>Task</th>
              <th style={th}>Business</th>
              <th style={th}>Horizon</th>
              <th style={{ ...th, whiteSpace: 'nowrap' }}>Due date</th>
              <th style={th}>Delegate</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr key={t.id}
                style={{ background: t.flagged ? '#fff7ed' : (i % 2 === 0 ? '#fff' : '#fafafa') }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                onMouseLeave={e => e.currentTarget.style.background = t.flagged ? '#fff7ed' : (i % 2 === 0 ? '#fff' : '#fafafa')}
              >
                <td style={{ padding: '6px 10px' }}>
                  <input type="checkbox" checked={t.flagged} onChange={() => onFlag(t.id)} style={{ cursor: 'pointer', width: 13, height: 13, accentColor: '#dc2626' }} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <StatusPill status={t.status} onClick={() => onCycle(t.id)} />
                </td>
                <td style={{ padding: '6px 10px', fontSize: 12, fontWeight: 500, color: t.overdue ? '#b91c1c' : '#111' }}>
                  {t.overdue && <OverdueBadge />}{t.name}
                  {t.flagged && <span style={{ fontSize: 9, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 3, marginLeft: 6 }}>do first</span>}
                </td>
                <td style={{ padding: '6px 10px' }}><BizTag biz={t.biz} /></td>
                <td style={{ padding: '6px 10px' }}><HorizonTag horizon={t.horizon} /></td>
                <td style={{ padding: '6px 10px', fontSize: 11, color: t.overdue ? '#dc2626' : '#555', fontWeight: t.overdue ? 600 : 400, whiteSpace: 'nowrap' }}>{t.due}</td>
                <td style={{ padding: '6px 10px', fontSize: 11, color: '#555' }}>{t.delegate || <span style={{ color: '#ddd' }}>-</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RightPanel({ tasks }) {
  const [mindset, setMindset] = useState('Lead the team with confidence and clarity.')

  const stats = [
    { label: 'Overdue',     value: tasks.filter(t => t.overdue && t.status !== 'done').length, color: '#dc2626' },
    { label: 'In progress', value: tasks.filter(t => t.status === 'doing').length,              color: '#2563eb' },
    { label: 'This week',   value: tasks.filter(t => t.horizon === 'This Week' && t.status !== 'done').length, color: '#d97706' },
    { label: 'Total open',  value: tasks.filter(t => t.status !== 'done').length,               color: '#6b7280' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={card}>
        <div style={cardHead}>Mental mindset</div>
        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: '#bbb', marginBottom: 6 }}>Hank texts you each morning. Your reply shows here.</div>
          <textarea value={mindset} onChange={e => setMindset(e.target.value)} rows={3}
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', color: '#1a1a1a', background: '#fafafa', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>Focus goals and projects</div>
        <div style={{ padding: '8px 12px' }}>
          {GOALS.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: i < GOALS.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#94a3b8', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.4 }}>{g}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>Today at a glance</div>
        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 500, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('daily')
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('hank-tasks-v2')
    return saved ? JSON.parse(saved) : INITIAL_TASKS.map(t => ({ ...t, flagged: false }))
  })

  useEffect(() => {
    localStorage.setItem('hank-tasks-v2', JSON.stringify(tasks))
  }, [tasks])

  const toggleFlag = (id) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, flagged: !t.flagged } : t))

  const cycleStatus = (id) => {
    const cycle = ['todo', 'doing', 'done']
    setTasks(prev => prev.map(t =>
      t.id !== id ? t : { ...t, status: cycle[(cycle.indexOf(t.status) + 1) % 3] }
    ))
  }

  const flagged   = tasks.filter(t => t.flagged && t.status !== 'done')
  const unflagged = tasks.filter(t => !t.flagged && t.status !== 'done')

  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setView(id)} style={{
      background: view === id ? 'rgba(255,255,255,0.15)' : 'transparent',
      border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '5px 14px',
      fontSize: 12, fontWeight: view === id ? 500 : 400,
      color: view === id ? '#fff' : 'rgba(255,255,255,0.45)',
      cursor: 'pointer', fontFamily: 'inherit',
    }}>{label}</button>
  )

  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh', padding: 16, boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: 3, color: '#ffffff' }}>HANK</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{TODAY}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {tabBtn('daily', 'Daily view')}
            {tabBtn('master', 'Master list')}
          </div>
          <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '5px 14px', fontSize: 12, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add task
          </button>
        </div>

        {view === 'daily' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 14, alignItems: 'start' }}>
            <Calendar />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DoFirst flagged={flagged} onRemove={toggleFlag} onCycle={cycleStatus} />
              <DailyTable tasks={unflagged} onFlag={toggleFlag} onCycle={cycleStatus} />
            </div>
            <RightPanel tasks={tasks} />
          </div>
        )}

        {view === 'master' && (
          <MasterTable tasks={tasks} onFlag={toggleFlag} onCycle={cycleStatus} />
        )}

      </div>
    </div>
  )
}
