const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Contacts ────────────────────────────────────────────────────────────────
  getContacts:    ()         => ipcRenderer.invoke('contacts:get'),
  saveContacts:   (contacts) => ipcRenderer.invoke('contacts:save', contacts),
  addContact:     (contact)  => ipcRenderer.invoke('contacts:add', contact),
  deleteContact:  (id)       => ipcRenderer.invoke('contacts:delete', id),

  // ── Scheduled Messages ───────────────────────────────────────────────────────
  getScheduled:    ()         => ipcRenderer.invoke('scheduled:get'),
  saveScheduled:   (items)    => ipcRenderer.invoke('scheduled:save', items),
  addScheduled:    (item)     => ipcRenderer.invoke('scheduled:add', item),
  updateScheduled: (id, patch)=> ipcRenderer.invoke('scheduled:update', id, patch),
  deleteScheduled: (id)       => ipcRenderer.invoke('scheduled:delete', id),

  // ── Jobs ─────────────────────────────────────────────────────────────────────
  getActiveJobs: () => ipcRenderer.invoke('jobs:active'),
  onJobFired: (callback) => {
    ipcRenderer.on('job:fired', (_event, payload) => callback(payload))
  },
  offJobFired: () => {
    ipcRenderer.removeAllListeners('job:fired')
  },

  // ── System cron ──────────────────────────────────────────────────────────────
  listCronJobs:  ()       => ipcRenderer.invoke('cron:list'),
  killCronJob:   (itemId) => ipcRenderer.invoke('cron:kill', itemId),
  killAllCronJobs: ()     => ipcRenderer.invoke('cron:killAll'),

  // ── Settings ─────────────────────────────────────────────────────────────────
  getSettings:  ()       => ipcRenderer.invoke('settings:get'),
  saveSettings: (s)      => ipcRenderer.invoke('settings:save', s),
})
