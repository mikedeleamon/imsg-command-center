import { useApp } from '../context/AppContext'
import StatCard from '../components/shared/StatCard'
import QueueItem from '../components/shared/QueueItem'

export default function Dashboard() {
  const { scheduled, contacts, navigate } = useApp()
  const recurring  = scheduled.filter(s => s.freq !== 'once').length
  const recipients = new Set(scheduled.map(s => s.recipient)).size
  const upcoming   = scheduled.slice(0, 5)

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-.03em' }}>Dashboard</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>Overview of your scheduled iMessages</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('compose')}>
          + New Message
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard value={scheduled.length} label="Total scheduled"  color="var(--accent)" />
        <StatCard value={recurring}        label="Recurring"         color="var(--green)" />
        <StatCard value={recipients}       label="Recipients"        color="var(--purple)" />
        <StatCard value={contacts.length}  label="Saved contacts"    color="var(--orange)" />
      </div>

      <div className="section-label">Upcoming Messages</div>

      {upcoming.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text3)', fontSize:13, lineHeight:2 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
          No messages scheduled yet.{' '}
          <span
            style={{ color:'var(--accent)', cursor:'pointer' }}
            onClick={() => navigate('compose')}
          >
            Compose your first →
          </span>
        </div>
      ) : (
        upcoming.map(item => <QueueItem key={item.id} item={item} />)
      )}

      {scheduled.length > 5 && (
        <button
          className="btn btn-ghost"
          style={{ marginTop: 8, width:'100%' }}
          onClick={() => navigate('queue')}
        >
          View all {scheduled.length} messages →
        </button>
      )}
    </div>
  )
}
