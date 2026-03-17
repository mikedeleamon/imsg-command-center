import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { initials } from '../utils/helpers'

function HistoryCard({ item, contacts }) {
  const contact = contacts.find(c =>
    c.handle === item.recipient ||
    c.handle.replace(/\D/g,'') === item.recipient.replace(/\D/g,'')
  )
  const displayName = contact?.name ?? item.recipient
  const color       = contact?.color ?? item.color ?? '#0a84ff'

  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border2)',
      borderRadius:'var(--radius)', marginBottom:10, overflow:'hidden',
      opacity: 0.85,
    }}>
      <div style={{ padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:14 }}>
        {/* Avatar */}
        <div style={{
          width:40, height:40, borderRadius:'50%', flexShrink:0,
          background: color + '22', color, overflow:'hidden',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:14, fontWeight:700,
        }}>
          {contact?.photo
            ? <img src={contact.photo} alt={displayName}
                style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : initials(displayName)
          }
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{displayName}</span>
            {contact && displayName !== item.recipient && (
              <span style={{ fontSize:11, color:'var(--text3)' }}>{item.recipient}</span>
            )}
            <span style={{
              fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20,
              background:'rgba(48,209,88,0.15)', color:'var(--green)',
              border:'1px solid rgba(48,209,88,0.3)',
            }}>✓ Sent</span>
            <span style={{
              fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20,
              background: item.msgType==='sms' ? 'rgba(48,209,88,0.12)' : 'rgba(10,132,255,0.12)',
              color:      item.msgType==='sms' ? 'var(--green)'          : 'var(--accent)',
              border:`1px solid ${item.msgType==='sms' ? 'rgba(48,209,88,0.25)' : 'rgba(10,132,255,0.2)'}`,
            }}>
              {item.msgType==='sms' ? '📱 SMS' : '💬 iMessage'}
            </span>
          </div>

          {/* Message preview */}
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:5,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {item.messages?.[0] ?? ''}
            {(item.messages?.length ?? 0) > 1 &&
              <span style={{color:'var(--text3)'}}> +{item.messages.length - 1} more</span>}
          </div>

          <div style={{ fontSize:11, color:'var(--text3)', display:'flex', gap:12, flexWrap:'wrap' }}>
            <span>📅 Scheduled: {item.date} at {item.time}</span>
            {item.lastRun && (
              <span style={{ color:'var(--green)' }}>
                ✓ Sent: {new Date(item.lastRun).toLocaleString()}
              </span>
            )}
            <span>🔁 {item.flabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function History() {
  const { scheduled, contacts, navigate } = useApp()
  const [search, setSearch] = useState('')

  const completed = scheduled.filter(s => s.completed)

  const filtered = completed.filter(s => {
    const q = search.toLowerCase()
    if (!q) return true
    const contact = contacts.find(c =>
      c.handle === s.recipient ||
      c.handle.replace(/\D/g,'') === s.recipient.replace(/\D/g,'')
    )
    return (
      s.recipient.toLowerCase().includes(q) ||
      (contact?.name ?? '').toLowerCase().includes(q) ||
      (s.messages ?? []).some(m => m.toLowerCase().includes(q))
    )
  })

  return (
    <div>
      <div className="flex-between" style={{ marginBottom:24 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-.03em' }}>History</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>
            {completed.length} completed message{completed.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('compose')}>+ New</button>
      </div>

      {completed.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <input
            type="text"
            placeholder="Search by name, number, or message…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth:360 }}
          />
        </div>
      )}

      {completed.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text3)', fontSize:13, lineHeight:2 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📜</div>
          No completed messages yet.<br/>
          Messages move here automatically after they're sent.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'32px', color:'var(--text3)', fontSize:13 }}>
          No results for "{search}"
        </div>
      ) : (
        filtered.map(item => (
          <HistoryCard key={item.id} item={item} contacts={contacts} />
        ))
      )}
    </div>
  )
}
