import { useState, useRef } from 'react'
import Modal from './Modal'
import { AVATAR_COLORS, initials } from '../utils/helpers'

// Converts a File to a base64 data-URL string
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AddContactModal({ onClose, onSave, contact }) {
  const isEdit = Boolean(contact)

  const [name,   setName]   = useState(contact?.name   ?? '')
  const [handle, setHandle] = useState(contact?.handle ?? '')
  const [color,  setColor]  = useState(contact?.color  ?? AVATAR_COLORS[0])
  const [photo,  setPhoto]  = useState(contact?.photo  ?? null)  // base64 data-URL
  const [error,  setError]  = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please select an image file.')
    if (file.size > 2 * 1024 * 1024) return setError('Photo must be under 2MB.')
    setUploading(true)
    try {
      const b64 = await fileToBase64(file)
      setPhoto(b64)
      setError('')
    } catch {
      setError('Failed to read image.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = () => {
    if (!name.trim())   return setError('Enter a name.')
    if (!handle.trim()) return setError('Enter a phone or Apple ID.')
    onSave({ name: name.trim(), handle: handle.trim(), color, photo })
  }

  return (
    <Modal
      title={isEdit ? 'Edit Contact' : 'Add Contact'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isEdit ? 'Save Changes' : 'Add Contact'}
          </button>
        </>
      }
    >
      {/* Avatar / photo preview */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
        <div style={{ position:'relative', width:72, height:72 }}>
          {/* Avatar circle */}
          <div style={{
            width:72, height:72, borderRadius:'50%',
            background: photo ? 'transparent' : color + '33',
            color, overflow:'hidden',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:24, fontWeight:700,
            border: `2px solid ${color}55`,
          }}>
            {photo
              ? <img src={photo} alt="contact" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : (name ? initials(name) : '?')
            }
          </div>

          {/* Upload button overlay */}
          <button
            onClick={() => fileRef.current.click()}
            style={{
              position:'absolute', bottom:0, right:0,
              width:24, height:24, borderRadius:'50%',
              background:'var(--bg3)', border:'2px solid var(--surface)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', fontSize:12, color:'var(--text)',
            }}
            title="Upload photo"
          >
            {uploading ? '…' : '📷'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display:'none' }}
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      {/* Photo actions */}
      <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:16 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => fileRef.current.click()}
        >
          {photo ? 'Change photo' : 'Upload photo'}
        </button>
        {photo && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setPhoto(null)}
          >
            Remove
          </button>
        )}
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
