import { useApp } from '../context/AppContext'
import StatCard from '../components/shared/StatCard'
import QueueItem from '../components/shared/QueueItem'

export default function Dashboard() {
  const { scheduled, contacts, failedJobs, navigate } = useApp()

  const recurring  = scheduled.filter(s => s.freq !== 'once').length
  const recipients = new Set(scheduled.map(s => s.recipient)).size
  const completed  = scheduled.filter(s => s.completed).length
  const failed     = failedJobs.length
  const upcoming = scheduled
    .filter(s => !s.completed)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, 5)

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-.03em' }}>Dashboard</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>Overview of your scheduled iMessages</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('compose')}>
          + New Message
        </button>
      </div>

      {/* 6-tile stat grid */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(3, 1fr)',
        gap:12, marginBottom:28,
      }}>
        <StatCard value={scheduled.length} label="Total scheduled"  color="var(--accent)"  />
        <StatCard value={recurring}        label="Recurring"         color="var(--purple)"  />
        <StatCard value={recipients}       label="Recipients"        color="var(--orange)"  />
        <StatCard value={contacts.length}  label="Saved contacts"    color="#32d2ff"        />
        <StatCard value={completed}        label="Jobs completed"    color="var(--green)"   />
        <StatCard
          value={failed}
          label="Jobs failed"
          color={failed > 0 ? 'var(--red)' : 'var(--text3)'}
        />
      </div>

      {/* Failed job detail — only shown when failures exist */}
      {failed > 0 && (
        <div style={{
          marginBottom:24,
          padding:'12px 16px',
          background:'rgba(255,69,58,0.08)',
          border:'1px solid rgba(255,69,58,0.25)',
          borderRadius:'var(--radius)',
        }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--red)', marginBottom:8 }}>
            ✗ Recent failures
          </div>
          {failedJobs.slice(-5).reverse().map((f, i) => (
            <div key={i} style={{
              fontSize:11, color:'var(--text2)', lineHeight:1.8,
              borderBottom: i < Math.min(failedJobs.length, 5) - 1 ? '1px solid rgba(255,69,58,0.1)' : 'none',
              paddingBottom:4, marginBottom:4,
            }}>
              <span style={{ color:'var(--red)' }}>#{f.id}</span>
              {' — '}{f.error}
              <span style={{ color:'var(--text3)', marginLeft:8 }}>
                {new Date(f.time).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="section-label">Upcoming Messages</div>

      {upcoming.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text3)', fontSize:13, lineHeight:2 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
          No messages scheduled yet.{' '}
          <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => navigate('compose')}>
            Compose your first →
          </span>
        </div>
      ) : (
        upcoming.map(item => <QueueItem key={item.id} item={item} />)
      )}

      {scheduled.filter(s => !s.completed).length > 5 && (
        <button className="btn btn-ghost" style={{ marginTop:8, width:'100%' }} onClick={() => navigate('queue')}>
          View all {scheduled.length} messages →
        </button>
      )}
    </div>
  )
}
