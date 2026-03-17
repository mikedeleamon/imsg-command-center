import { useState } from 'react'
import { useApp } from '../context/AppContext'
import AddContactModal from '../components/AddContactModal'
import { initials } from '../utils/helpers'

function Avatar({ contact, size = 52 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: contact.photo ? 'transparent' : contact.color + '22',
      color: contact.color, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700,
      flexShrink: 0,
    }}>
      {contact.photo
        ? <img src={contact.photo} alt={contact.name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : initials(contact.name)
      }
    </div>
  )
}

function ContactCard({ contact, onEdit, onDelete, onMessage }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        background: hov ? 'var(--surface2)' : 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 'var(--radius)', padding: 16,
        textAlign:'center', transition:'all .15s',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
        <Avatar contact={contact} size={52} />
      </div>
      <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:3 }}>
        {contact.name}
      </div>
      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
        {contact.handle}
      </div>
      <div style={{ display:'flex', gap:5, justifyContent:'center', flexWrap:'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onMessage(contact)}>
          Message
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(contact)}>
          Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(contact.id)}>
          ✕
        </button>
      </div>
    </div>
  )
}

export default function Contacts() {
  const { contacts, addContact, updateContact, deleteContact, navigate } = useApp()
  const [modalContact, setModalContact] = useState(null)  // null=closed, {}=add, contact=edit
  const [search, setSearch] = useState('')

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.handle.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = ()        => setModalContact({})
  const openEdit = (contact) => setModalContact(contact)
  const closeModal = ()      => setModalContact(null)

  const handleSave = async (data) => {
    if (modalContact?.id) {
      await updateContact(modalContact.id, data)
    } else {
      await addContact(data)
    }
    closeModal()
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
        <button className="btn btn-primary" onClick={openAdd}>+ Add Contact</button>
      </div>

      {/* Search — always visible once there's at least one contact */}
      {contacts.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <input
            type="text"
            placeholder="Search by name or number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth:320 }}
          />
        </div>
      )}

      {contacts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text3)', fontSize:13, lineHeight:2 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
          No contacts yet.<br/>
          <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={openAdd}>
            Add your first contact →
          </span>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:12 }}>
          {filtered.map(c => (
            <ContactCard
              key={c.id}
              contact={c}
              onEdit={openEdit}
              onDelete={deleteContact}
              onMessage={handleMessage}
            />
          ))}
          <div
            onClick={openAdd}
            style={{
              border:'1px dashed var(--border)', borderRadius:'var(--radius)',
              padding:16, cursor:'pointer', textAlign:'center',
              display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', minHeight:148,
              color:'var(--text3)', fontSize:12, transition:'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text3)' }}
          >
            <div style={{ fontSize:24, marginBottom:8 }}>+</div>
            Add Contact
          </div>
        </div>
      )}

      {modalContact !== null && (
        <AddContactModal
          contact={modalContact?.id ? modalContact : undefined}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
