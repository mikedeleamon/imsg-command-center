import { useApp } from '../../context/AppContext'
import ScriptPanel from './ScriptPanel'
import { initials } from '../../utils/helpers'

function StatusDot({ active, completed, paused }) {
  if (completed) return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: 'rgba(48,209,88,0.15)', color: 'var(--green)',
      border: '1px solid rgba(48,209,88,0.3)',
    }}>✓ Sent</span>
  )
  if (paused) return (
    <span className="chip chip-paused">⏸ Paused</span>
  )
  if (active) return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: 'rgba(10,132,255,0.15)', color: 'var(--accent)',
      border: '1px solid rgba(10,132,255,0.3)',
      display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      {/* Pulsing dot */}
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--accent)',
        display: 'inline-block',
        animation: 'pulse 1.8s ease-in-out infinite',
      }} />
      Scheduled
    </span>
  )
  return <span className="chip chip-once">Pending</span>
}

export default function QueueItem({ item }) {
  const { updateScheduled, deleteScheduled, activeJobs } = useApp()

  const isActive    = activeJobs.includes(item.id)
  const preview     = item.messages?.[0] ?? ''
  const short       = preview.length > 58 ? preview.slice(0, 58) + '…' : preview
  const extra       = (item.messages?.length ?? 1) - 1
  const color       = item.color ?? '#0a84ff'
  const freqChipCls = item.freq === 'once' ? 'chip chip-once' : 'chip chip-repeat'

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)', marginBottom: 10, overflow: 'hidden',
          transition: 'border-color .15s',
          opacity: item.completed ? 0.6 : 1,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      >
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: color + '22', color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700,
          }}>
            {initials(item.recipient)}
          </div>

          {/* Body */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {item.recipient}
              </span>
              {/* Channel badge */}
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: item.msgType === 'sms' ? 'rgba(48,209,88,0.15)' : 'rgba(10,132,255,0.12)',
                color:      item.msgType === 'sms' ? 'var(--green)'          : 'var(--accent)',
                border:     `1px solid ${item.msgType === 'sms' ? 'rgba(48,209,88,0.3)' : 'rgba(10,132,255,0.25)'}`,
              }}>
                {item.msgType === 'sms' ? '📱 SMS' : '💬 iMessage'}
              </span>
              {/* Frequency chip */}
              <span className={freqChipCls}>{item.flabel}</span>
              {/* Live status chip */}
              <StatusDot
                active={isActive}
                completed={item.completed}
                paused={item.paused}
              />
            </div>

            <div style={{
              fontSize: 12, color: 'var(--text2)', marginBottom: 5,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {short}
              {extra > 0 && <span style={{ color: 'var(--text3)' }}> +{extra} more</span>}
            </div>

            <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span>📅 {item.date} at {item.time}</span>
              <span>💬 {item.messages?.length ?? 1} msg{(item.messages?.length ?? 1) > 1 ? 's' : ''}</span>
              {item.lastRun && (
                <span style={{ color: 'var(--green)' }}>
                  ✓ Last sent {new Date(item.lastRun).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {!item.completed && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => updateScheduled(item.id, { paused: !item.paused })}
              >
                {item.paused ? 'Resume' : 'Pause'}
              </button>
            )}
            <button
              className="btn btn-danger btn-sm"
              onClick={() => deleteScheduled(item.id)}
            >
              Delete
            </button>
          </div>
        </div>

        {/* App-closed warning for active jobs */}
        {isActive && !item.completed && (
          <div style={{
            margin: '0 16px 10px',
            padding: '8px 12px',
            background: 'rgba(255,214,10,0.08)',
            border: '1px solid rgba(255,214,10,0.2)',
            borderRadius: 'var(--radius-xs)',
            fontSize: 11, color: 'var(--yellow)', lineHeight: 1.6,
          }}>
            ⚠️ This job runs while the app is open. For it to fire when the app is closed, use the script below to set up a system cron job.
          </div>
        )}

        {/* Script panel */}
        <div style={{ padding: '0 16px 14px' }}>
          <ScriptPanel item={item} />
        </div>
      </div>
    </>
  )
}
