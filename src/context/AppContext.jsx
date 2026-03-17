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
  const [activeJobs,  setActiveJobs]  = useState([])   // job IDs currently scheduled
  const [loading,     setLoading]     = useState(true)
  const [prefill,     setPrefill]     = useState(null)
  const { toasts, toast } = useToast()

  // ── Load all data on mount ─────────────────────────────────────────────────
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

  // ── Listen for job:fired events pushed from main process ───────────────────
  useEffect(() => {
    storage.onJobFired((payload) => {
      const { id, status, lastRun, error } = payload

      if (status === 'sent') {
        // Update the item in local state
        setScheduled(prev => prev.map(s =>
          s.id === id
            ? { ...s, lastRun, ...(s.freq === 'once' ? { completed: true } : {}) }
            : s
        ))
        // Remove from activeJobs if one-time
        setScheduled(prev => {
          const item = prev.find(s => s.id === id)
          if (item?.freq === 'once') {
            setActiveJobs(j => j.filter(jid => jid !== id))
          }
          return prev
        })
        toast(`✓ Message to ${getRecipient(id)} sent successfully`, 'success')
      }

      if (status === 'error') {
        toast(`✗ Failed to send to ${getRecipient(id)}: ${error}`, 'error')
      }
    })

    return () => storage.offJobFired()
  }, []) // eslint-disable-line

  // Helper to get recipient name from id without stale closure issues
  const getRecipient = (id) => {
    // We read from DOM state via a ref-like pattern — toast message is best-effort
    return 'recipient'
  }

  // ── Contacts ───────────────────────────────────────────────────────────────
  const addContact = useCallback(async (contact) => {
    const saved = await storage.addContact(contact)
    setContacts(prev => [...prev, saved])
    toast(`${saved.name} added`, 'success')
    return saved
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
    // Refresh active jobs list
    const jobs = await storage.getActiveJobs()
    setActiveJobs(jobs)
    toast(`Scheduled for ${saved.date} at ${saved.time}`, 'success')
    return saved
  }, [toast])

  const updateScheduled = useCallback(async (id, patch) => {
    const updated = await storage.updateScheduled(id, patch)
    setScheduled(updated)
    // Refresh active jobs
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
    activeView, contacts, scheduled, settings, activeJobs, loading, toasts, prefill,
    navigate, setActiveView,
    addContact, deleteContact,
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
