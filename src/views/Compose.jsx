import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { freqLabel, colorForName } from '../utils/helpers'

function todayPlus1h() {
  const n = new Date()
  n.setHours(n.getHours() + 1, 0, 0, 0)
  return {
    date: n.toISOString().split('T')[0],
    time: n.toTimeString().slice(0, 5),
  }
}

// ── Message type toggle ──────────────────────────────────────────────────────
function MsgTypeToggle({ value, onChange }) {
  const opts = [
    {
      id:    'imessage',
      label: 'iMessage',
      icon:  '💬',
      desc:  'Sent over internet via Apple ID or phone number',
      color: '#0a84ff',
      bg:    'rgba(10,132,255,0.15)',
      border:'rgba(10,132,255,0.4)',
    },
    {
      id:    'sms',
      label: 'SMS',
      icon:  '📱',
      desc:  'Green bubble — requires iPhone on same network (Continuity)',
      color: '#30d158',
      bg:    'rgba(48,209,88,0.15)',
      border:'rgba(48,209,88,0.4)',
    },
  ]

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
      {opts.map(o => {
        const active = value === o.id
        return (
          <div
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              flex: 1, padding: '12px 14px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${active ? o.border : 'var(--border)'}`,
              background: active ? o.bg : 'var(--bg1)',
              cursor: 'pointer', transition: 'all .15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{o.icon}</span>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: active ? o.color : 'var(--text2)',
              }}>
                {o.label}
              </span>
              {active && (
                <span style={{
                  marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                  background: o.color, flexShrink: 0,
                }} />
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>
              {o.desc}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Message sequence input ───────────────────────────────────────────────────
function MsgSequence({ messages, onChange }) {
  const add    = () => onChange([...messages, ''])
  const remove = (i) => { if (messages.length <= 1) return; onChange(messages.filter((_, j) => j !== i)) }
  const update = (i, val) => onChange(messages.map((m, j) => j === i ? val : m))

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
          <div style={{
            width:22, height:22, borderRadius:'50%', background:'var(--bg2)',
            color:'var(--text3)', fontSize:10, fontWeight:600, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', marginTop:10,
          }}>
            {i + 1}
          </div>
          <textarea
            placeholder={`Message ${i + 1}…`}
            value={msg}
            onChange={e => update(i, e.target.value)}
            style={{ flex:1, minHeight:60 }}
          />
          <button
            onClick={() => remove(i)}
            style={{
              width:28, height:28, borderRadius:'var(--radius-xs)',
              background:'none', border:'1px solid var(--border)',
              color:'var(--text3)', cursor:'pointer', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, marginTop:8, transition:'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,69,58,0.15)'; e.currentTarget.style.color='var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text3)' }}
            title="Remove"
          >✕</button>
        </div>
      ))}
      <button
        className="btn btn-ghost"
        style={{ width:'100%', marginTop:4, fontSize:12,
                 border:'1px dashed var(--border)', color:'var(--accent)' }}
        onClick={add}
      >
        + Add message to sequence
      </button>
    </div>
  )
}

// ── Bubble preview ───────────────────────────────────────────────────────────
function Preview({ recipient, messages, date, time, freq, cNum, cUnit, msgType }) {
  const label     = freqLabel(freq, cNum, cUnit)
  const validMsgs = messages.filter(Boolean)
  const isSMS     = msgType === 'sms'

  // iMessage = blue, SMS = green
  const bubbleColor   = isSMS ? '#1a8a3c' : 'var(--accent)'
  const channelLabel  = isSMS ? '📱 SMS' : '💬 iMessage'
  const channelColor  = isSMS ? 'var(--green)' : 'var(--accent)'

  return (
    <div className="card" style={{ position:'sticky', top:0 }}>
      <div className="card-header">
        <div className="card-title">Preview</div>
        <span style={{
          marginLeft:'auto', fontSize:11, fontWeight:600,
          padding:'2px 10px', borderRadius:20,
          background: isSMS ? 'rgba(48,209,88,0.15)' : 'rgba(10,132,255,0.15)',
          color: channelColor,
          border: `1px solid ${isSMS ? 'rgba(48,209,88,0.3)' : 'rgba(10,132,255,0.3)'}`,
        }}>
          {channelLabel}
        </span>
      </div>

      {/* iOS-style chat window */}
      <div style={{
        background:'var(--bg0)', borderRadius:'var(--radius-sm)',
        padding:16, minHeight:120,
      }}>
        <div style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginBottom:12 }}>
          {recipient || '—'}
        </div>
        {validMsgs.length === 0 ? (
          <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center' }}>
            Messages will appear here
          </div>
        ) : (
          validMsgs.map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'flex-end', marginBottom:6 }}>
              <div style={{
                background: bubbleColor, color:'#fff',
                borderRadius:'14px 14px 4px 14px',
                padding:'8px 12px', fontSize:12, maxWidth:'80%',
                wordBreak:'break-word', lineHeight:1.4,
              }}>
                {m}
              </div>
            </div>
          ))
        )}
      </div>

      {isSMS && (
        <div style={{
          marginTop:12, padding:'8px 10px', borderRadius:'var(--radius-xs)',
          background:'rgba(255,214,10,0.08)', border:'1px solid rgba(255,214,10,0.2)',
          fontSize:11, color:'var(--yellow)', lineHeight:1.6,
        }}>
          ⚠️ SMS requires your iPhone to be on the same Wi-Fi as your Mac with
          Continuity enabled (Settings → Phone → Calls on Other Devices / Text Message Forwarding).
        </div>
      )}

      <div className="separator" />
      <div style={{ fontSize:11, color:'var(--text3)', lineHeight:2.2 }}>
        <div>📅 {date && time ? `${date} at ${time}` : 'Not scheduled'}</div>
        <div>{freq === 'once' ? '🔂 Send once' : `🔁 ${label}`}</div>
      </div>

      <div className="separator" />
      <div className="card-header" style={{ marginBottom:0, paddingBottom:0, border:'none' }}>
        <div className="card-title">💡 How it works</div>
      </div>
      <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.9, marginTop:10 }}>
        <b style={{color:'var(--text)'}}>1.</b> Schedule your message here<br/>
        <b style={{color:'var(--text)'}}>2.</b> Click <b style={{color:'var(--text)'}}>View script</b> on the queue item<br/>
        <b style={{color:'var(--text)'}}>3.</b> Copy → paste into Script Editor.app<br/>
        <b style={{color:'var(--text)'}}>4.</b> Follow the Terminal setup steps<br/>
        <b style={{color:'var(--text)'}}>5.</b> Mac sends messages automatically
      </div>
    </div>
  )
}

// ── Main Compose view ────────────────────────────────────────────────────────
export default function Compose() {
  const { contacts, addScheduled, navigate, prefill, clearPrefill } = useApp()
  const { date: d0, time: t0 } = todayPlus1h()

  const [msgType,   setMsgType]   = useState('imessage')
  const [recipient, setRecipient] = useState('')
  const [messages,  setMessages]  = useState([''])
  const [date,      setDate]      = useState(d0)
  const [time,      setTime]      = useState(t0)
  const [freq,      setFreq]      = useState('once')
  const [cNum,      setCNum]      = useState('2')
  const [cUnit,     setCUnit]     = useState('days')
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (prefill?.recipient) {
      setRecipient(prefill.recipient)
      if (prefill.msgType) setMsgType(prefill.msgType)
      clearPrefill()
    }
  }, [prefill, clearPrefill])

  const showError = useCallback((msg) => {
    setError(msg)
    setTimeout(() => setError(''), 3500)
  }, [])

  const handleSchedule = async () => {
    if (!recipient.trim())                    return showError('Enter a recipient.')
    if (!messages.filter(Boolean).length)     return showError('Write at least one message.')
    if (!date || !time)                       return showError('Set a date and time.')

    const item = {
      recipient: recipient.trim(),
      msgType,
      messages:  messages.filter(Boolean),
      date, time, freq, cNum, cUnit,
      flabel: freqLabel(freq, cNum, cUnit),
      paused:    false,
      color:     colorForName(recipient.trim()),
    }
    await addScheduled(item)

    setRecipient(''); setMessages([''])
    setMsgType('imessage')
    setFreq('once'); setCNum('2'); setCUnit('days')
    navigate('queue')
  }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-.03em' }}>Compose</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>Schedule a new message</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>
        {/* ── Left: form ── */}
        <div>
          {/* Channel selector */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Message Type</div>
            </div>
            <MsgTypeToggle value={msgType} onChange={setMsgType} />
          </div>

          {/* Recipient */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recipient</div>
                <div className="card-subtitle">
                  {msgType === 'sms'
                    ? 'Phone number required for SMS'
                    : 'Phone number or Apple ID email'}
                </div>
              </div>
            </div>

            <div className="field">
              <label>To</label>
              <input
                type="text"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder={msgType === 'sms'
                  ? '+1 (555) 000-0000'
                  : '+1 (555) 000-0000 or name@icloud.com'}
              />
            </div>

            {contacts.length > 0 && (
              <div className="field">
                <label>Quick-select</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {contacts.map(c => (
                    <span
                      key={c.id}
                      onClick={() => setRecipient(c.handle)}
                      style={{
                        padding:'4px 12px', borderRadius:20, cursor:'pointer',
                        background: recipient === c.handle ? 'rgba(10,132,255,0.2)' : 'var(--bg2)',
                        border: `1px solid ${recipient === c.handle ? 'rgba(10,132,255,.4)' : 'var(--border)'}`,
                        color: recipient === c.handle ? 'var(--accent)' : 'var(--text2)',
                        fontSize:12, transition:'all .15s',
                      }}
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="card">
            <div className="card-header">
              <div className="flex-between" style={{ width:'100%' }}>
                <div>
                  <div className="card-title">Message Sequence</div>
                  <div className="card-subtitle">Sent in order, one after another</div>
                </div>
              </div>
            </div>
            <MsgSequence messages={messages} onChange={setMessages} />
          </div>

          {/* Schedule */}
          <div className="card">
            <div className="card-header"><div className="card-title">Schedule &amp; Frequency</div></div>

            <div className="row2">
              <div className="field">
                <label>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Time</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Frequency</label>
              <select value={freq} onChange={e => setFreq(e.target.value)}>
                <option value="once">Send once</option>
                <option value="hourly">Every hour</option>
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
                <option value="custom">Custom interval…</option>
              </select>
            </div>

            {freq === 'custom' && (
              <div className="row2">
                <div className="field">
                  <label>Every</label>
                  <input type="number" value={cNum} min="1"
                    onChange={e => setCNum(e.target.value)} />
                </div>
                <div className="field">
                  <label>Unit</label>
                  <select value={cUnit} onChange={e => setCUnit(e.target.value)}>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                  </select>
                </div>
              </div>
            )}

            <div className="separator" />

            <button
              className="btn btn-primary"
              style={{ width:'100%', justifyContent:'center', padding:12 }}
              onClick={handleSchedule}
            >
              Schedule {msgType === 'sms' ? 'Text Message' : 'iMessage'}
            </button>

            {error && (
              <div style={{ fontSize:12, color:'var(--red)', marginTop:8 }}>{error}</div>
            )}
          </div>
        </div>

        {/* ── Right: preview ── */}
        <Preview
          msgType={msgType}
          recipient={recipient}
          messages={messages}
          date={date} time={time}
          freq={freq} cNum={cNum} cUnit={cUnit}
        />
      </div>
    </div>
  )
}
