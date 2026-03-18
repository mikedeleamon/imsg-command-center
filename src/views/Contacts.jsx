import { useState } from 'react'
import { useApp } from '../context/AppContext'
import AddContactModal from '../components/AddContactModal'
import { initials } from '../utils/helpers'

// ── Shared avatar ─────────────────────────────────────────────────────────────
function Avatar({ contact, size = 52 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: contact.photo ? 'transparent' : contact.color + '22',
      color: contact.color, overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700,
    }}>
      {contact.photo
        ? <img src={contact.photo} alt={contact.name}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : initials(contact.name)
      }
    </div>
  )
}

// ── Checkbox ──────────────────────────────────────────────────────────────────
function Checkbox({ checked, color, onToggle }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onToggle() }}
      style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        background: checked ? color : 'var(--bg2)',
        border: `2px solid ${checked ? color : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all .15s',
        fontSize: 11, color: '#fff', fontWeight: 700,
      }}
    >
      {checked ? '✓' : ''}
    </div>
  )
}

// ── Card view ─────────────────────────────────────────────────────────────────
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
      {/* Checkbox — visible on hover or when selecting */}
      {(selecting || hov) && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
          <Checkbox
            checked={selected}
            color={contact.color}
            onToggle={() => onToggle(contact.id)}
          />
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
        <Avatar contact={contact} size={52} />
      </div>
      <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:3 }}>
        {contact.name}
      </div>
      <div style={{ fontSize:11, color:'var(--text3)', marginBottom: selecting ? 0 : 12,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
        {contact.handle}
      </div>

      {!selecting && (
        <div style={{ display:'flex', gap:5, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn btn-secondary btn-sm"
            onClick={e => { e.stopPropagation(); onMessage(contact) }}>
            Message
          </button>
          <button className="btn btn-ghost btn-sm"
            onClick={e => { e.stopPropagation(); onEdit(contact) }}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm"
            onClick={e => { e.stopPropagation(); onDelete(contact.id) }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

// ── List / table view ─────────────────────────────────────────────────────────
function ContactRow({ contact, selected, selecting, onToggle, onEdit, onDelete, onMessage }) {
  const [hov, setHov] = useState(false)
  return (
    <tr
      onClick={() => selecting && onToggle(contact.id)}
      style={{
        background: selected ? contact.color + '12' : hov ? 'var(--surface2)' : 'transparent',
        cursor: selecting ? 'pointer' : 'default',
        transition: 'background .12s',
        borderBottom: '1px solid var(--border2)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Checkbox cell */}
      <td style={{ padding: '10px 12px', width: 36 }}>
        {(selecting || hov) && (
          <Checkbox
            checked={selected}
            color={contact.color}
            onToggle={() => onToggle(contact.id)}
          />
        )}
      </td>

      {/* Avatar + name */}
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Avatar contact={contact} size={32} />
          <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>
            {contact.name}
          </span>
        </div>
      </td>

      {/* Handle */}
      <td style={{ padding: '10px 12px', fontSize:12, color:'var(--text2)' }}>
        {contact.handle}
      </td>

      {/* Actions */}
      <td style={{ padding: '10px 12px', width: selecting ? 0 : 200 }}>
        {!selecting && (
          <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary btn-sm"
              onClick={e => { e.stopPropagation(); onMessage(contact) }}>
              Message
            </button>
            <button className="btn btn-ghost btn-sm"
              onClick={e => { e.stopPropagation(); onEdit(contact) }}>
              Edit
            </button>
            <button className="btn btn-danger btn-sm"
              onClick={e => { e.stopPropagation(); onDelete(contact.id) }}>
              ✕
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ── View toggle icons ─────────────────────────────────────────────────────────
function ViewToggle({ view, onChange }) {
  const opts = [
    { id: 'card', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <rect x="0" y="0" width="6" height="6" rx="1"/><rect x="8" y="0" width="6" height="6" rx="1"/>
        <rect x="0" y="8" width="6" height="6" rx="1"/><rect x="8" y="8" width="6" height="6" rx="1"/>
      </svg>
    )},
    { id: 'list', icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <rect x="0" y="1" width="14" height="2" rx="1"/><rect x="0" y="6" width="14" height="2" rx="1"/>
        <rect x="0" y="11" width="14" height="2" rx="1"/>
      </svg>
    )},
  ]
  return (
    <div style={{
      display:'flex', background:'var(--bg1)',
      border:'1px solid var(--border)', borderRadius:'var(--radius-xs)',
      overflow:'hidden',
    }}>
      {opts.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: '6px 10px', border:'none', cursor:'pointer',
            background: view === o.id ? 'var(--bg3)' : 'transparent',
            color: view === o.id ? 'var(--text)' : 'var(--text3)',
            transition: 'all .12s', display:'flex', alignItems:'center',
          }}
        >
          {o.icon}
        </button>
      ))}
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function Contacts() {
  const { contacts, addContact, updateContact, deleteContact, navigate, toast } = useApp()
  const [modalContact, setModalContact] = useState(null)
  const [search,       setSearch]       = useState('')
  const [selected,     setSelected]     = useState(new Set())
  const [viewMode,     setViewMode]     = useState('card') // 'card' | 'list'

  // Sort alphabetically, then filter
  const filtered = contacts
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.handle.toLowerCase().includes(search.toLowerCase())
    )

  const selecting = selected.size > 0

  // ── Selection ────────────────────────────────────────────────────────────
  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const selectAll           = () => setSelected(new Set(filtered.map(c => c.id)))
  const clearSelection      = () => setSelected(new Set())
  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))

  // ── Bulk actions ─────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    const count = selected.size
    if (!window.confirm(`Delete ${count} contact${count !== 1 ? 's' : ''}? This cannot be undone.`)) return
    for (const id of selected) await deleteContact(id, true)
    clearSelection()
    toast(`Deleted ${count} contact${count !== 1 ? 's' : ''}`, 'info')
  }

  const handleBulkMessage = () => {
    const handles = contacts.filter(c => selected.has(c.id)).map(c => c.handle)
    navigate('compose', { prefill: { recipients: handles } })
    clearSelection()
  }

  // ── Modal ────────────────────────────────────────────────────────────────
  const openAdd    = ()        => setModalContact({})
  const openEdit   = (contact) => setModalContact(contact)
  const closeModal = ()        => setModalContact(null)

  const handleSave = async (data) => {
    if (modalContact?.id) await updateContact(modalContact.id, data)
    else                   await addContact(data)
    closeModal()
  }

  const handleMessage = (contact) => {
    navigate('compose', { prefill: { recipient: contact.handle } })
  }

  // Shared props for both views
  const itemProps = (c) => ({
    contact:   c,
    selected:  selected.has(c.id),
    selecting,
    onToggle:  toggleOne,
    onEdit:    openEdit,
    onDelete:  deleteContact,
    onMessage: handleMessage,
  })

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-.03em' }}>Contacts</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>
            {contacts.length} saved contact{contacts.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Contact</button>
      </div>

      {/* ── Toolbar: search + view toggle ── */}
      {contacts.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <input
            type="text"
            placeholder="Search by name or number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth:320, flex:'0 0 auto' }}
          />
          <div style={{ marginLeft:'auto' }}>
            <ViewToggle view={viewMode} onChange={v => { setViewMode(v); clearSelection() }} />
          </div>
        </div>
      )}

      {/* ── Selection toolbar ── */}
      {selecting && (
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'10px 14px', marginBottom:14,
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:'var(--radius)', flexWrap:'wrap',
        }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginRight:4 }}>
            {selected.size} selected
          </span>
          <button className="btn btn-ghost btn-sm"
            onClick={allFilteredSelected ? clearSelection : selectAll}>
            {allFilteredSelected ? 'Deselect all' : 'Select all'}
          </button>
          <div style={{ width:1, height:20, background:'var(--border)', marginLeft:4 }} />
          <button className="btn btn-secondary btn-sm" onClick={handleBulkMessage}>
            💬 Message {selected.size}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            🗑 Delete {selected.size}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={clearSelection}
            style={{ marginLeft:'auto' }}>
            Cancel
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {contacts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text3)', fontSize:13, lineHeight:2 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
          No contacts yet.<br/>
          <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={openAdd}>
            Add your first contact →
          </span>
        </div>

      ) : viewMode === 'card' ? (
        /* ── Card grid ── */
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:12 }}>
          {filtered.map(c => <ContactCard key={c.id} {...itemProps(c)} />)}

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

      ) : (
        /* ── List table ── */
        <div style={{
          background:'var(--surface)', border:'1px solid var(--border2)',
          borderRadius:'var(--radius)', overflow:'hidden',
        }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border2)' }}>
                <th style={{ width:36 }} />
                <th style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600,
                             color:'var(--text3)', letterSpacing:'.04em', textTransform:'uppercase' }}>
                  Name
                </th>
                <th style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600,
                             color:'var(--text3)', letterSpacing:'.04em', textTransform:'uppercase' }}>
                  Phone / Apple ID
                </th>
                <th style={{ padding:'9px 12px', textAlign:'right', fontSize:11, fontWeight:600,
                             color:'var(--text3)', letterSpacing:'.04em', textTransform:'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => <ContactRow key={c.id} {...itemProps(c)} />)}
            </tbody>
          </table>

          {!selecting && (
            <div
              onClick={openAdd}
              style={{
                padding:'12px 16px', cursor:'pointer', textAlign:'center',
                fontSize:12, color:'var(--text3)', borderTop:'1px dashed var(--border)',
                transition:'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color='var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color='var(--text3)' }}
            >
              + Add Contact
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
