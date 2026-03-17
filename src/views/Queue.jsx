import { useState } from 'react'
import { useApp } from '../context/AppContext'
import QueueItem from '../components/shared/QueueItem'
import CronManager from '../components/shared/CronManager'

const FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'once',   label: 'One-time' },
  { key: 'repeat', label: 'Recurring' },
  { key: 'paused', label: 'Paused' },
]

export default function Queue() {
  const { scheduled, navigate } = useApp()
  const [filter, setFilter] = useState('all')

  const visible = scheduled.filter(s => {
    if (filter === 'all')    return true
    if (filter === 'once')   return s.freq === 'once' && !s.paused
    if (filter === 'repeat') return s.freq !== 'once' && !s.paused
    if (filter === 'paused') return s.paused
    return true
  })

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-.03em' }}>Message Queue</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>
            {scheduled.length} message{scheduled.length !== 1 ? 's' : ''} scheduled
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('compose')}>+ New</button>
      </div>

      <div className="tab-bar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`tab${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'all' && scheduled.length > 0 &&
              <span style={{ marginLeft:6, fontSize:10, opacity:.6 }}>({scheduled.length})</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text3)', fontSize:13, lineHeight:2 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
          {scheduled.length === 0
            ? <>No messages scheduled yet. <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => navigate('compose')}>Compose one →</span></>
            : `No ${filter} messages.`}
        </div>
      ) : (
        visible.map(item => <QueueItem key={item.id} item={item} />)
      )}

      {/* System cron manager — always visible at the bottom */}
      <div style={{ marginTop: 28 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>System Cron Jobs</div>
        <CronManager />
      </div>
    </div>
  )
}
