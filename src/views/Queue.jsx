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

  // Only active (non-completed) items live here
  const active = scheduled.filter(s => !s.completed)

  const visible = active.filter(s => {
    if (filter === 'all')    return true
    if (filter === 'once')   return s.freq === 'once' && !s.paused
    if (filter === 'repeat') return s.freq !== 'once' && !s.paused
    if (filter === 'paused') return s.paused
    return true
  })

  return (
    <div>
      <div className="flex-between" style={{ marginBottom:24 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-.03em' }}>Message Queue</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>
            {active.length} active message{active.length !== 1 ? 's' : ''}
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
            {f.key === 'all' && active.length > 0 &&
              <span style={{ marginLeft:6, fontSize:10, opacity:.6 }}>({active.length})</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text3)', fontSize:13, lineHeight:2 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
          {active.length === 0
            ? <>No active messages. <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => navigate('compose')}>Compose one →</span></>
            : `No ${filter} messages.`}
        </div>
      ) : (
        visible.map(item => <QueueItem key={item.id} item={item} />)
      )}

      <div style={{ marginTop:28 }}>
        <div className="section-label" style={{ marginBottom:12 }}>System Cron Jobs</div>
        <CronManager />
      </div>
    </div>
  )
}
