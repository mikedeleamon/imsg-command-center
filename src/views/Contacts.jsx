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
      fontSize: size * 0.34, fontWeight: 700, flexShrink: 0,
    }}>
      {contact.photo
        ? <img src={contact.photo} alt={contact.name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : initials(contact.name)
      }
    </div>
  )
}

function ContactCard({ contact, selected, selecting, onToggle, onEdit, onDelete, onMessage }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onClick={() => selecting && onToggle(contact.id)}
      style={{
        background: selected ? contact.color + '18' : hov ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${selected ? contact.color + '55' : 'var(--border2)'}`,
        borderRadius: 'var(--radius)', padding: 16,
        textAlign: 'center', transition: 'all .15s',
        cursor: selecting ? 'pointer' : 'default',
        position: 'relative',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Selection checkbox — visible when any selection active OR on hover */}
      {(selecting || hov) && (
        <div
          onClick={e => { e.stopPropagation(); onToggle(contact.id) }}
          style={{
            position: 'absolute', top: 10, left: 10,
            width: 18, height: 18, borderRadius: 5,
            background: selected ? contact.color : 'var(--bg2)',
            border: `2px solid ${selected ? contact.color : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all .15s', zIndex: 1,
            fontSize: 11, color: '#fff', fontWeight: 700,
          }}
        >
          {selected ? '✓' : ''}
        </div>
      )}

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

      {/* Per-card actions — hidden while in selection mode */}
      {!selecting && (
        <div style={{ display:'flex', gap:5, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); onMessage(contact) }}>
            Message
          </button>
          <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onEdit(contact) }}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); onDelete(contact.id) }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default function Contacts() {
  const { contacts, addContact, updateContact, deleteContact, navigate, toast } = useApp()
  const [modalContact, setModalContact] = useState(null)
  const [search,       setSearch]       = useState('')
  const [selected,     setSelected]     = useState(new Set()) // ids

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.handle.toLowerCase().includes(search.toLowerCase())
  )

  const selecting = selected.size > 0

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set(filtered.map(c => c.id)))
  }

  const clearSelection = () => setSelected(new Set())

  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))

  // ── Bulk actions ─────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    const count = selected.size
    if (!window.confirm(`Delete ${count} contact${count !== 1 ? 's' : ''}? This cannot be undone.`)) return
    // deleteContact confirms per-item; bypass that by calling storage directly
    for (const id of selected) {
      await deleteContact(id, true) // skipConfirm=true
    }
    clearSelection()
    toast(`Deleted ${count} contact${count !== 1 ? 's' : ''}`, 'info')
  }

  const handleBulkMessage = () => {
    const handles = contacts.filter(c => selected.has(c.id)).map(c => c.handle)
    // Prefill Compose with all selected handles
    navigate('compose', { prefill: { recipients: handles } })
    clearSelection()
  }

  // ── Modal ────────────────────────────────────────────────────────────────
  const openAdd  = ()        => setModalContact({})
  const openEdit = (contact) => setModalContact(contact)
  const closeModal = ()      => setModalContact(null)

  const handleSave = async (data) => {
    if (modalContact?.id) await updateContact(modalContact.id, data)
    else                   await addContact(data)
    closeModal()
  }

  const handleMessage = (contact) => {
    navigate('compose', { prefill: { recipient: contact.handle } })
  }

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-.03em' }}>Contacts</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>
            {contacts.length} saved contact{contacts.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Contact</button>
      </div>

      {/* ── Search ── */}
      {contacts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search by name or number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>
      )}

      {/* ── Selection toolbar — appears when ≥1 selected ── */}
      {selecting && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', marginBottom: 14,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', flexWrap: 'wrap',
        }}>
          {/* Count + select-all toggle */}
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginRight:4 }}>
            {selected.size} selected
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={allFilteredSelected ? clearSelection : selectAll}
          >
            {allFilteredSelected ? 'Deselect all' : 'Select all'}
          </button>

          {/* Divider */}
          <div style={{ width:1, height:20, background:'var(--border)', marginLeft:4 }} />

          {/* Bulk message */}
          <button className="btn btn-secondary btn-sm" onClick={handleBulkMessage}>
            💬 Message {selected.size}
          </button>

          {/* Bulk delete */}
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            🗑 Delete {selected.size}
          </button>

          {/* Cancel */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={clearSelection}
            style={{ marginLeft:'auto' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Grid ── */}
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
              selected={selected.has(c.id)}
              selecting={selecting}
              onToggle={toggleOne}
              onEdit={openEdit}
              onDelete={deleteContact}
              onMessage={handleMessage}
            />
          ))}

          {/* Add new — hidden while in selection mode */}
          {!selecting && (
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
          )}
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
