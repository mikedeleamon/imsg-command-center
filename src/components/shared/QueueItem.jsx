import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import ScriptPanel from './ScriptPanel'
import EditScheduledModal from '../EditScheduledModal'
import { initials } from '../../utils/helpers'

// Normalise a phone string to digits only for fuzzy matching
const digits = (s) => String(s ?? '').replace(/\D/g, '')

// Find a contact whose handle matches the recipient (exact or digit-normalised)
function resolveContact(contacts, recipient) {
  if (!recipient) return null
  return contacts.find(c =>
    c.handle === recipient ||
    (digits(c.handle) && digits(c.handle) === digits(recipient))
  ) ?? null
}

function StatusDot({ active, paused }) {
  if (paused) return <span className="chip chip-paused">⏸ Paused</span>
  if (active) return (
    <span style={{
      fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20,
      background:'rgba(10,132,255,0.15)', color:'var(--accent)',
      border:'1px solid rgba(10,132,255,0.3)',
      display:'inline-flex', alignItems:'center', gap:5,
    }}>
      <span style={{
        width:6, height:6, borderRadius:'50%', background:'var(--accent)',
        display:'inline-block', animation:'pulse 1.8s ease-in-out infinite',
      }} />
      Scheduled
    </span>
  )
  return <span className="chip chip-once">Pending</span>
}

function ContactAvatar({ contact, item, size = 40 }) {
  const color = contact?.color ?? item.color ?? '#0a84ff'
  const name  = contact?.name  ?? item.recipient
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background: color + '22', color, overflow:'hidden',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size * 0.35, fontWeight:700,
    }}>
      {contact?.photo
        ? <img src={contact.photo} alt={name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : initials(name)
      }
    </div>
  )
}

export default function QueueItem({ item }) {
  const { updateScheduled, deleteScheduled, activeJobs, contacts } = useApp()
  const [showEdit, setShowEdit] = useState(false)

  const contact     = resolveContact(contacts, item.recipient)
  const displayName = contact?.name ?? item.recipient
  const isActive    = activeJobs.includes(item.id)
  const preview     = item.messages?.[0] ?? ''
  const short       = preview.length > 58 ? preview.slice(0,58)+'…' : preview
  const extra       = (item.messages?.length ?? 1) - 1
  const freqChipCls = item.freq === 'once' ? 'chip chip-once' : 'chip chip-repeat'

  const handleEditSave = async (patch) => {
    await updateScheduled(item.id, { ...patch, completed: false })
    setShowEdit(false)
  }

  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      <div
        style={{
          background:'var(--surface)', border:'1px solid var(--border2)',
          borderRadius:'var(--radius)', marginBottom:10, overflow:'hidden',
          transition:'border-color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor='var(--border)'}
        onMouseLeave={e => e.currentTarget.style.borderColor='var(--border2)'}
      >
        <div style={{ padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:14 }}>
          <ContactAvatar contact={contact} item={item} />

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
              {/* Name — contact name if matched, otherwise raw recipient */}
              <span style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{displayName}</span>
              {/* Show raw number beneath name if we resolved a contact */}
              {contact && displayName !== item.recipient && (
                <span style={{ fontSize:11, color:'var(--text3)' }}>{item.recipient}</span>
              )}
              {/* Channel */}
              <span style={{
                fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20,
                background: item.msgType==='sms' ? 'rgba(48,209,88,0.15)' : 'rgba(10,132,255,0.12)',
                color:      item.msgType==='sms' ? 'var(--green)'          : 'var(--accent)',
                border:`1px solid ${item.msgType==='sms' ? 'rgba(48,209,88,0.3)' : 'rgba(10,132,255,0.25)'}`,
              }}>
                {item.msgType==='sms' ? '📱 SMS' : '💬 iMessage'}
              </span>
              <span className={freqChipCls}>{item.flabel}</span>
              <StatusDot active={isActive} paused={item.paused} />
            </div>

            <div style={{
              fontSize:12, color:'var(--text2)', marginBottom:5,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {short}{extra > 0 && <span style={{color:'var(--text3)'}}> +{extra} more</span>}
            </div>

            <div style={{ fontSize:11, color:'var(--text3)', display:'flex', gap:12, flexWrap:'wrap' }}>
              <span>📅 {item.date} at {item.time}</span>
              <span>💬 {item.messages?.length ?? 1} msg{(item.messages?.length??1)>1?'s':''}</span>
              {item.lastRun && (
                <span style={{color:'var(--green)'}}>
                  ✓ Last sent {new Date(item.lastRun).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
            <button className="btn btn-ghost btn-sm"
              onClick={() => updateScheduled(item.id, { paused: !item.paused })}>
              {item.paused ? 'Resume' : 'Pause'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteScheduled(item.id)}>Delete</button>
          </div>
        </div>

        {isActive && (
          <div style={{
            margin:'0 16px 10px', padding:'8px 12px',
            background:'rgba(255,214,10,0.08)', border:'1px solid rgba(255,214,10,0.2)',
            borderRadius:'var(--radius-xs)', fontSize:11, color:'var(--yellow)', lineHeight:1.6,
          }}>
            ⚠️ Fires while the app is open. Use the script below to set up a system cron job for when the app is closed.
          </div>
        )}

        <div style={{ padding:'0 16px 14px' }}>
          <ScriptPanel item={item} />
        </div>
      </div>

      {showEdit && (
        <EditScheduledModal
          item={item}
          onClose={() => setShowEdit(false)}
          onSave={handleEditSave}
        />
      )}
    </>
  )
}
