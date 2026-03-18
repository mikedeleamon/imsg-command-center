import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import ScriptPanel from './ScriptPanel'
import EditScheduledModal from '../EditScheduledModal'
import { initials } from '../../utils/helpers'

const digits = (s) => String(s ?? '').replace(/\D/g, '')

function resolveContact(contacts, handle) {
  if (!handle) return null
  return contacts.find(c =>
    c.handle === handle ||
    (digits(c.handle) && digits(c.handle) === digits(handle))
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

// Single avatar circle
function Avatar({ handle, contact, size = 32 }) {
  const color = contact?.color ?? '#0a84ff'
  const name  = contact?.name  ?? handle
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background: color + '22', color, overflow:'hidden',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.34, fontWeight:700,
      border: '2px solid var(--surface)',
    }}>
      {contact?.photo
        ? <img src={contact.photo} alt={name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : initials(name)
      }
    </div>
  )
}

// Stacked avatars for multi-recipient items
function RecipientAvatars({ handles, contacts }) {
  const MAX_SHOWN = 3
  const shown  = handles.slice(0, MAX_SHOWN)
  const extra  = handles.length - MAX_SHOWN

  return (
    <div style={{ display:'flex', flexShrink:0 }}>
      {shown.map((h, i) => {
        const c = resolveContact(contacts, h)
        return (
          <div key={h} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: shown.length - i }}>
            <Avatar handle={h} contact={c} size={36} />
          </div>
        )
      })}
      {extra > 0 && (
        <div style={{
          marginLeft: -10, zIndex: 0,
          width:36, height:36, borderRadius:'50%', flexShrink:0,
          background:'var(--bg3)', color:'var(--text2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:10, fontWeight:700,
          border: '2px solid var(--surface)',
        }}>
          +{extra}
        </div>
      )}
    </div>
  )
}

// Recipient name chips for multi-recipient items
function RecipientList({ handles, contacts }) {
  const [expanded, setExpanded] = useState(false)
  const MAX_INLINE = 3
  const shown  = expanded ? handles : handles.slice(0, MAX_INLINE)
  const hidden = handles.length - MAX_INLINE

  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
      {shown.map(h => {
        const c     = resolveContact(contacts, h)
        const label = c?.name ?? h
        const color = c?.color ?? '#0a84ff'
        return (
          <span key={h} style={{
            display:'inline-flex', alignItems:'center', gap:4,
            fontSize:11, fontWeight:500,
            padding:'2px 7px', borderRadius:20,
            background: color + '18', color: 'var(--text)',
            border: `1px solid ${color}33`,
          }}>
            {c?.photo
              ? <img src={c.photo} alt={label}
                  style={{ width:12, height:12, borderRadius:'50%', objectFit:'cover' }} />
              : <span style={{ fontSize:8, fontWeight:700, color }}>{initials(label)}</span>
            }
            {label}
          </span>
        )
      })}
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:11, color:'var(--accent)', padding:0,
          }}
        >
          +{hidden} more
        </button>
      )}
    </div>
  )
}

export default function QueueItem({ item }) {
  const { updateScheduled, deleteScheduled, activeJobs, contacts } = useApp()
  const [showEdit, setShowEdit] = useState(false)

  // Normalise: support both legacy single-recipient and new multi-recipient items
  const allHandles  = item.recipients?.length ? item.recipients : [item.recipient].filter(Boolean)
  const isMulti     = allHandles.length > 1
  const firstContact = resolveContact(contacts, allHandles[0])
  const displayName  = isMulti
    ? `${firstContact?.name ?? allHandles[0]} & ${allHandles.length - 1} other${allHandles.length > 2 ? 's' : ''}`
    : (firstContact?.name ?? allHandles[0] ?? '')

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

          {/* Avatar(s) */}
          {isMulti
            ? <RecipientAvatars handles={allHandles} contacts={contacts} />
            : <Avatar handle={allHandles[0]} contact={firstContact} size={40} />
          }

          <div style={{ flex:1, minWidth:0 }}>
            {/* Top row: name + chips */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
              <span style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{displayName}</span>
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

            {/* Multi-recipient name chips */}
            {isMulti && (
              <div style={{ marginBottom:6 }}>
                <RecipientList handles={allHandles} contacts={contacts} />
              </div>
            )}

            {/* Message preview */}
            <div style={{
              fontSize:12, color:'var(--text2)', marginBottom:5,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {short}{extra > 0 && <span style={{color:'var(--text3)'}}> +{extra} more</span>}
            </div>

            {/* Meta */}
            <div style={{ fontSize:11, color:'var(--text3)', display:'flex', gap:12, flexWrap:'wrap' }}>
              <span>📅 {item.date} at {item.time}</span>
              <span>💬 {item.messages?.length ?? 1} msg{(item.messages?.length??1)>1?'s':''}</span>
              {isMulti && <span>👥 {allHandles.length} recipients</span>}
              {item.lastRun && (
                <span style={{color:'var(--green)'}}>
                  ✓ Last sent {new Date(item.lastRun).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
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
