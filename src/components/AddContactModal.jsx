import { useState } from 'react'
import Modal from './Modal'
import { AVATAR_COLORS, initials } from '../utils/helpers'

export default function AddContactModal({ onClose, onSave }) {
  const [name,    setName]    = useState('')
  const [handle,  setHandle]  = useState('')
  const [color,   setColor]   = useState(AVATAR_COLORS[0])
  const [error,   setError]   = useState('')

  const handleSave = () => {
    if (!name.trim())   return setError('Enter a name.')
    if (!handle.trim()) return setError('Enter a phone or Apple ID.')
    onSave({ name: name.trim(), handle: handle.trim(), color })
  }

  return (
    <Modal
      title="Add Contact"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Add Contact</button>
        </>
      }
    >
      {/* Avatar preview */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
        <div style={{
          width:56, height:56, borderRadius:'50%',
          background: color + '33', color,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:20, fontWeight:700,
        }}>
          {name ? initials(name) : '?'}
        </div>
      </div>

      <div className="field">
        <label>Name</label>
        <input
          type="text" value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="e.g. Mom"
          autoFocus
        />
      </div>

      <div className="field">
        <label>Phone or Apple ID</label>
        <input
          type="text" value={handle}
          onChange={e => { setHandle(e.target.value); setError('') }}
          placeholder="+1 555 000 0000 or email@icloud.com"
        />
      </div>

      <div className="field">
        <label>Color</label>
        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          {AVATAR_COLORS.map(c => (
            <div
              key={c}
              onClick={() => setColor(c)}
              style={{
                width:26, height:26, borderRadius:'50%', background:c,
                cursor:'pointer', flexShrink:0,
                border: color === c ? '2px solid #fff' : '2px solid transparent',
                boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                transition:'all .15s',
              }}
            />
          ))}
        </div>
      </div>

      {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:4 }}>{error}</div>}
    </Modal>
  )
}
