import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { storage } from '../hooks/useStorage'
import { useToast } from '../hooks/useToast'

const AppContext = createContext(null)

const DEFAULT_SETTINGS = {
  scriptPath:       '~/imsg_scripts/',
  macVersion:       'macOS 15 Sequoia',
  showSleepNote:    true,
  showDeliveryNote: true,
  confirmDelete:    true,
}

export function AppProvider({ children }) {
  const [activeView,  setActiveView]  = useState('dashboard')
  const [contacts,    setContacts]    = useState([])
  const [scheduled,   setScheduled]   = useState([])
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS)
  const [activeJobs,  setActiveJobs]  = useState([])
  const [failedJobs,  setFailedJobs]  = useState([])  // { id, error, time }
  const [loading,     setLoading]     = useState(true)
  const [prefill,     setPrefill]     = useState(null)
  const { toasts, toast } = useToast()

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      storage.getContacts(),
      storage.getScheduled(),
      storage.getSettings(),
      storage.getActiveJobs(),
    ]).then(([c, s, st, jobs]) => {
      setContacts(c    || [])
      setScheduled(s   || [])
      setSettings({ ...DEFAULT_SETTINGS, ...(st || {}) })
      setActiveJobs(jobs || [])
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // ── Listen for job fire events ─────────────────────────────────────────────
  useEffect(() => {
    storage.onJobFired((payload) => {
      const { id, status, lastRun, error } = payload

      if (status === 'sent') {
        setScheduled(prev => prev.map(s =>
          s.id === id
            ? { ...s, lastRun, ...(s.freq === 'once' ? { completed: true } : {}) }
            : s
        ))
        setActiveJobs(prev => {
          const item = scheduled.find(s => s.id === id)
          return item?.freq === 'once' ? prev.filter(jid => jid !== id) : prev
        })
        toast(`Message to ${recipientForId(id)} sent ✓`, 'success')
      }

      if (status === 'error') {
        setFailedJobs(prev => [...prev, { id, error, time: new Date().toISOString() }])
        toast(`Failed to send to ${recipientForId(id)}: ${error}`, 'error')
      }
    })
    return () => storage.offJobFired()
  }, []) // eslint-disable-line

  // Reads from latest scheduled ref — best effort for toast text
  const recipientForId = (id) => {
    const found = scheduled.find(s => s.id === id)
    return found?.recipient ?? 'recipient'
  }

  // ── Contacts ───────────────────────────────────────────────────────────────
  const addContact = useCallback(async (contact) => {
    const saved = await storage.addContact(contact)
    setContacts(prev => [...prev, saved])
    toast(`${saved.name} added`, 'success')
    return saved
  }, [toast])

  const updateContact = useCallback(async (id, patch) => {
    const updated = await storage.updateContact(id, patch)
    setContacts(updated)
    toast('Contact updated', 'success')
  }, [toast])

  const deleteContact = useCallback(async (id, skipConfirm = false) => {
    if (!skipConfirm && settings.confirmDelete) {
      if (!window.confirm('Remove this contact?')) return
    }
    const updated = await storage.deleteContact(id)
    setContacts(updated)
    toast('Contact removed', 'info')
  }, [settings.confirmDelete, toast])

  // ── Scheduled ──────────────────────────────────────────────────────────────
  const addScheduled = useCallback(async (item) => {
    const saved = await storage.addScheduled(item)
    setScheduled(prev => [...prev, saved])
    const jobs = await storage.getActiveJobs()
    setActiveJobs(jobs)
    toast(`Scheduled for ${saved.date} at ${saved.time}`, 'success')
    return saved
  }, [toast])

  const updateScheduled = useCallback(async (id, patch) => {
    const updated = await storage.updateScheduled(id, patch)
    setScheduled(updated)
    const jobs = await storage.getActiveJobs()
    setActiveJobs(jobs)
  }, [])

  const deleteScheduled = useCallback(async (id) => {
    if (settings.confirmDelete) {
      if (!window.confirm('Delete this scheduled message?')) return
    }
    const updated = await storage.deleteScheduled(id)
    setScheduled(updated)
    setActiveJobs(prev => prev.filter(jid => jid !== id))
    toast('Message removed', 'info')
  }, [settings.confirmDelete, toast])

  // ── Settings ───────────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (patch) => {
    const merged = { ...settings, ...patch }
    setSettings(merged)
    await storage.saveSettings(merged)
    toast('Settings saved', 'success')
  }, [settings, toast])

  // ── Nav ────────────────────────────────────────────────────────────────────
  const navigate = useCallback((view, opts = {}) => {
    setActiveView(view)
    if (opts.prefill) setPrefill(opts.prefill)
  }, [])

  const clearPrefill = useCallback(() => setPrefill(null), [])

  const value = {
    activeView, contacts, scheduled, settings, activeJobs, failedJobs,
    loading, toasts, prefill,
    navigate, setActiveView,
    addContact, updateContact, deleteContact,
    addScheduled, updateScheduled, deleteScheduled,
    updateSettings,
    clearPrefill,
    toast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
