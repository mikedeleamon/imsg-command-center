import { useState } from 'react'
import Modal from './Modal'
import { freqLabel } from '../utils/helpers'

function MsgSequence({ messages, onChange }) {
  const add    = () => onChange([...messages, ''])
  const remove = (i) => { if (messages.length <= 1) return; onChange(messages.filter((_, j) => j !== i)) }
  const update = (i, val) => onChange(messages.map((m, j) => j === i ? val : m))

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
          <div style={{
            width:20, height:20, borderRadius:'50%', background:'var(--bg2)',
            color:'var(--text3)', fontSize:10, fontWeight:600, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', marginTop:10,
          }}>
            {i + 1}
          </div>
          <textarea
            value={msg}
            onChange={e => update(i, e.target.value)}
            style={{ flex:1, minHeight:52, fontSize:13 }}
            placeholder={`Message ${i + 1}…`}
          />
          <button
            onClick={() => remove(i)}
            style={{
              width:26, height:26, borderRadius:'var(--radius-xs)',
              background:'none', border:'1px solid var(--border)',
              color:'var(--text3)', cursor:'pointer', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, marginTop:8, transition:'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,69,58,0.15)'; e.currentTarget.style.color='var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text3)' }}
          >✕</button>
        </div>
      ))}
      <button
        className="btn btn-ghost btn-sm"
        style={{ width:'100%', marginTop:4, border:'1px dashed var(--border)', color:'var(--accent)' }}
        onClick={add}
      >
        + Add message
      </button>
    </div>
  )
}

export default function EditScheduledModal({ item, onClose, onSave }) {
  const [msgType,   setMsgType]   = useState(item.msgType   ?? 'imessage')
  const [recipient, setRecipient] = useState(item.recipient ?? '')
  const [messages,  setMessages]  = useState(item.messages?.length ? item.messages : [''])
  const [date,      setDate]      = useState(item.date      ?? '')
  const [time,      setTime]      = useState(item.time      ?? '')
  const [freq,      setFreq]      = useState(item.freq      ?? 'once')
  const [cNum,      setCNum]      = useState(item.cNum      ?? '2')
  const [cUnit,     setCUnit]     = useState(item.cUnit     ?? 'days')
  const [error,     setError]     = useState('')

  const handleSave = () => {
    if (!recipient.trim())               return setError('Enter a recipient.')
    if (!messages.filter(Boolean).length) return setError('Enter at least one message.')
    if (!date || !time)                  return setError('Set a date and time.')

    onSave({
      msgType,
      recipient: recipient.trim(),
      messages:  messages.filter(Boolean),
      date, time, freq, cNum, cUnit,
      flabel: freqLabel(freq, cNum, cUnit),
    })
  }

  const TYPE_OPTS = [
    { id:'imessage', label:'💬 iMessage', color:'var(--accent)',  bg:'rgba(10,132,255,0.15)', border:'rgba(10,132,255,0.4)' },
    { id:'sms',      label:'📱 SMS',      color:'var(--green)',   bg:'rgba(48,209,88,0.15)',  border:'rgba(48,209,88,0.4)'  },
  ]

  return (
    <Modal
      title="Edit Scheduled Message"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </>
      }
    >
      {/* Message type */}
      <div className="field">
        <label>Message type</label>
        <div style={{ display:'flex', gap:8 }}>
          {TYPE_OPTS.map(o => {
            const active = msgType === o.id
            return (
              <div
                key={o.id}
                onClick={() => setMsgType(o.id)}
                style={{
                  flex:1, padding:'8px 12px', borderRadius:'var(--radius-sm)',
                  border:`1.5px solid ${active ? o.border : 'var(--border)'}`,
                  background: active ? o.bg : 'var(--bg1)',
                  cursor:'pointer', transition:'all .15s',
                  fontSize:12, fontWeight:600,
                  color: active ? o.color : 'var(--text2)',
                  textAlign:'center',
                }}
              >
                {o.label}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recipient */}
      <div className="field">
        <label>Recipient</label>
        <input
          type="text" value={recipient}
          onChange={e => { setRecipient(e.target.value); setError('') }}
          placeholder="+1 (555) 000-0000 or name@icloud.com"
        />
      </div>

      {/* Messages */}
      <div className="field">
        <label>Messages</label>
        <MsgSequence messages={messages} onChange={setMessages} />
      </div>

      {/* Date / time */}
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

      {/* Frequency */}
      <div className="field">
        <label>Frequency</label>
        <select value={freq} onChange={e => setFreq(e.target.value)}>
          <option value="once">Send once</option>
          <option value="hourly">Every hour</option>
          <option value="daily">Every day</option>
          <option value="weekdays">Every weekday (Mon–Fri)</option>
          <option value="weekends">Every weekend (Sat–Sun)</option>
          <option value="weekly">Every week</option>
          <option value="monthly">Every month</option>
          <option value="custom">Custom interval…</option>
        </select>
      </div>

      {freq === 'custom' && (
        <div className="row2">
          <div className="field">
            <label>Every</label>
            <input type="number" value={cNum} min="1" onChange={e => setCNum(e.target.value)} />
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

      {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:4 }}>{error}</div>}
    </Modal>
  )
}
