import { useState } from 'react'
import { useApp } from '../context/AppContext'
import AddContactModal from '../components/AddContactModal'
import { initials } from '../utils/helpers'

function ContactCard({ contact, onDelete, onMessage }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        background: hov ? 'var(--surface2)' : 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 'var(--radius)', padding: 16,
        textAlign:'center', transition:'all .15s', cursor:'default',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        width:52, height:52, borderRadius:'50%',
        background: contact.color + '22', color: contact.color,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18, fontWeight:700, margin:'0 auto 10px',
      }}>
        {initials(contact.name)}
      </div>
      <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:3 }}>
        {contact.name}
      </div>
      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
        {contact.handle}
      </div>
      <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onMessage(contact)}>
          Message
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(contact.id)}>
          ✕
        </button>
      </div>
    </div>
  )
}

export default function Contacts() {
  const { contacts, addContact, deleteContact, navigate } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch]       = useState('')

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.handle.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (data) => {
    await addContact(data)
    setShowModal(false)
  }

  const handleMessage = (contact) => {
    navigate('compose', { prefill: { recipient: contact.handle } })
  }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-.03em' }}>Contacts</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>
            {contacts.length} saved contact{contacts.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Contact
        </button>
      </div>

      {contacts.length > 4 && (
        <div style={{ marginBottom:20 }}>
          <input
            type="text"
            placeholder="Search contacts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth:280 }}
          />
        </div>
      )}

      {contacts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text3)', fontSize:13, lineHeight:2 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
          No contacts yet.<br/>
          <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => setShowModal(true)}>
            Add your first contact →
          </span>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:12 }}>
          {filtered.map(c => (
            <ContactCard
              key={c.id}
              contact={c}
              onDelete={(id) => deleteContact(id)}
              onMessage={handleMessage}
            />
          ))}
          {/* Add new card */}
          <div
            onClick={() => setShowModal(true)}
            style={{
              border:'1px dashed var(--border)', borderRadius:'var(--radius)',
              padding:16, cursor:'pointer', textAlign:'center',
              display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', minHeight:148,
              color:'var(--text3)', fontSize:12,
              transition:'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text3)' }}
          >
            <div style={{ fontSize:24, marginBottom:8 }}>+</div>
            Add Contact
          </div>
        </div>
      )}

      {showModal && (
        <AddContactModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
