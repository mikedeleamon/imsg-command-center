/**
 * useStorage
 *
 * Thin abstraction over window.electronAPI (Electron) or localStorage (browser).
 * Components never import from either directly — they call this hook.
 */

const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI)

// ── localStorage fallback helpers ────────────────────────────────────────────

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

// ── public API ───────────────────────────────────────────────────────────────

export const storage = {
  // Contacts
  getContacts: () =>
    isElectron
      ? window.electronAPI.getContacts()
      : Promise.resolve(lsGet('contacts', [])),

  addContact: (contact) =>
    isElectron
      ? window.electronAPI.addContact(contact)
      : Promise.resolve((() => {
          const list = lsGet('contacts', [])
          const item = { ...contact, id: Date.now() }
          lsSet('contacts', [...list, item])
          return item
        })()),

  updateContact: (id, patch) =>
    isElectron
      ? window.electronAPI.updateContact(id, patch)
      : Promise.resolve((() => {
          const updated = lsGet('contacts', []).map(c => c.id === id ? { ...c, ...patch } : c)
          lsSet('contacts', updated)
          return updated
        })()),

  deleteContact: (id) =>
    isElectron
      ? window.electronAPI.deleteContact(id)
      : Promise.resolve((() => {
          const updated = lsGet('contacts', []).filter(c => c.id !== id)
          lsSet('contacts', updated)
          return updated
        })()),

  saveContacts: (contacts) =>
    isElectron
      ? window.electronAPI.saveContacts(contacts)
      : Promise.resolve(lsSet('contacts', contacts)),

  // Scheduled
  getScheduled: () =>
    isElectron
      ? window.electronAPI.getScheduled()
      : Promise.resolve(lsGet('scheduled', [])),

  addScheduled: (item) =>
    isElectron
      ? window.electronAPI.addScheduled(item)
      : Promise.resolve((() => {
          const list = lsGet('scheduled', [])
          const newItem = { ...item, id: Date.now() }
          lsSet('scheduled', [...list, newItem])
          return newItem
        })()),

  updateScheduled: (id, patch) =>
    isElectron
      ? window.electronAPI.updateScheduled(id, patch)
      : Promise.resolve((() => {
          const updated = lsGet('scheduled', []).map(s =>
            s.id === id ? { ...s, ...patch } : s
          )
          lsSet('scheduled', updated)
          return updated
        })()),

  deleteScheduled: (id) =>
    isElectron
      ? window.electronAPI.deleteScheduled(id)
      : Promise.resolve((() => {
          const updated = lsGet('scheduled', []).filter(s => s.id !== id)
          lsSet('scheduled', updated)
          return updated
        })()),

  // Jobs (Electron only — no-op in browser)
  getActiveJobs: () =>
    isElectron ? window.electronAPI.getActiveJobs() : Promise.resolve([]),

  onJobFired: (cb) => {
    if (isElectron) window.electronAPI.onJobFired(cb)
  },

  offJobFired: () => {
    if (isElectron) window.electronAPI.offJobFired()
  },

  // System cron (Electron only)
  listCronJobs: () =>
    isElectron ? window.electronAPI.listCronJobs() : Promise.resolve({ lines: [], raw: '' }),

  killCronJob: (itemId) =>
    isElectron ? window.electronAPI.killCronJob(itemId) : Promise.resolve({ removed: 0 }),

  killAllCronJobs: () =>
    isElectron ? window.electronAPI.killAllCronJobs() : Promise.resolve({ removed: 0 }),

  // Settings
  getSettings: () =>
    isElectron
      ? window.electronAPI.getSettings()
      : Promise.resolve(lsGet('settings', {
          scriptPath: '~/imsg_scripts/',
          macVersion: 'macOS 15 Sequoia',
          showSleepNote: true,
          showDeliveryNote: true,
          confirmDelete: true,
        })),

  saveSettings: (settings) =>
    isElectron
      ? window.electronAPI.saveSettings(settings)
      : Promise.resolve(lsSet('settings', settings)),
}
