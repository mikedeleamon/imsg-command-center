import { useApp } from '../context/AppContext'

const NAV = [
  { id: 'dashboard', icon: '💬', label: 'Dashboard',  color: 'rgba(10,132,255,.15)' },
  { id: 'compose',   icon: '✏️',  label: 'Compose',   color: 'rgba(48,209,88,.15)' },
  { id: 'queue',     icon: '📋', label: 'Queue',      color: 'rgba(255,159,10,.15)', badge: true },
]

const MANAGE = [
  { id: 'contacts', icon: '👥', label: 'Contacts', color: 'rgba(191,90,242,.15)' },
  { id: 'settings', icon: '⚙️',  label: 'Settings', color: 'rgba(99,99,102,.2)' },
]

function NavItem({ item, active, badge }) {
  const { navigate } = useApp()
  return (
    <div
      onClick={() => navigate(item.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px', cursor: 'pointer',
        borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        background: active ? 'rgba(10,132,255,0.12)' : 'none',
        color: active ? 'var(--accent)' : 'var(--text2)',
        fontSize: 13, transition: 'all .12s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none' }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: item.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, flexShrink: 0,
      }}>
        {item.icon}
      </div>
      {item.label}
      {badge > 0 && (
        <span style={{
          marginLeft: 'auto', background: 'var(--accent)', color: '#fff',
          fontSize: 10, fontWeight: 600, padding: '1px 6px',
          borderRadius: 20, minWidth: 18, textAlign: 'center',
        }}>
          {badge}
        </span>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { activeView, scheduled, contacts } = useApp()

  const recurring = scheduled.filter(s => s.freq !== 'once').length

  return (
    <aside style={{
      width: 210, flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border2)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', padding: '16px 0',
    }}>
      <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.08em',
                    color:'var(--text3)', textTransform:'uppercase',
                    padding:'12px 16px 6px' }}>
        Command Center
      </div>

      {NAV.map(item => (
        <NavItem
          key={item.id}
          item={item}
          active={activeView === item.id}
          badge={item.badge ? scheduled.length : 0}
        />
      ))}

      <div style={{ height:1, background:'var(--border2)', margin:'8px 16px' }} />

      <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.08em',
                    color:'var(--text3)', textTransform:'uppercase',
                    padding:'12px 16px 6px' }}>
        Manage
      </div>

      {MANAGE.map(item => (
        <NavItem key={item.id} item={item} active={activeView === item.id} />
      ))}

      {/* Footer stats */}
      <div style={{
        marginTop: 'auto', borderTop: '1px solid var(--border2)',
        padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {[
          ['Scheduled', scheduled.length],
          ['Recurring', recurring],
          ['Contacts',  contacts.length],
        ].map(([label, val]) => (
          <div key={label} style={{ fontSize:11, color:'var(--text3)' }}>
            {label}: <span style={{ color:'var(--text2)', fontWeight:500 }}>{val}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
