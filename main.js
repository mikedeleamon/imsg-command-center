const { app, BrowserWindow, ipcMain, shell, Notification } = require('electron')
const path     = require('path')
const fs       = require('fs').promises
const { exec } = require('child_process')
const schedule = require('node-schedule')

const isDev = process.env.NODE_ENV === 'development'

// ── In-memory job registry  { itemId -> node-schedule Job } ──────────────────
const activeJobs = new Map()

// ── Helpers ───────────────────────────────────────────────────────────────────

function dataPath(filename) {
  return path.join(app.getPath('userData'), filename)
}

async function readJSON(filename, fallback = []) {
  try {
    const raw = await fs.readFile(dataPath(filename), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJSON(filename, data) {
  await fs.writeFile(dataPath(filename), JSON.stringify(data, null, 2), 'utf-8')
  return true
}

// ── AppleScript builder + runner ──────────────────────────────────────────────

function buildAppleScript(item) {
  const escAS      = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const serviceType = item.msgType === 'sms' ? 'SMS' : 'iMessage'

  // Support both single recipient (legacy) and recipients array
  const allRecipients = item.recipients?.length
    ? item.recipients
    : [item.recipient].filter(Boolean)

  const sends = allRecipients.flatMap(rec =>
    (item.messages ?? []).map(m =>
      `  set targetBuddy to buddy "${escAS(rec)}" of targetService\n  send "${escAS(m)}" to targetBuddy`
    )
  ).join('\n')

  return [
    'tell application "Messages"',
    `  set targetService to 1st service whose service type = ${serviceType}`,
    sends,
    'end tell',
  ].join('\n')
}

function runAppleScript(item) {
  return new Promise((resolve, reject) => {
    const script  = buildAppleScript(item)
    const escaped = script.replace(/'/g, "'\\''")
    exec(`osascript -e '${escaped}'`, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message))
      else     resolve(stdout.trim())
    })
  })
}

// ── Notify renderer ───────────────────────────────────────────────────────────

function notifyRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload)
  }
}

function showSystemNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  }
}

// ── Job scheduler ─────────────────────────────────────────────────────────────

function buildScheduleRule(item) {
  const [hour, minute] = (item.time ?? '09:00').split(':').map(Number)

  if (item.freq === 'once') {
    return new Date(`${item.date}T${item.time}:00`)
  }
  if (item.freq === 'hourly') {
    const rule = new schedule.RecurrenceRule()
    rule.minute = minute
    return rule
  }
  if (item.freq === 'daily') {
    const rule = new schedule.RecurrenceRule()
    rule.hour = hour; rule.minute = minute
    return rule
  }
  if (item.freq === 'weekdays') {
    const rule = new schedule.RecurrenceRule()
    rule.dayOfWeek = [1, 2, 3, 4, 5]
    rule.hour = hour; rule.minute = minute
    return rule
  }
  if (item.freq === 'weekends') {
    const rule = new schedule.RecurrenceRule()
    rule.dayOfWeek = [0, 6]
    rule.hour = hour; rule.minute = minute
    return rule
  }
  if (item.freq === 'weekly') {
    const rule = new schedule.RecurrenceRule()
    rule.dayOfWeek = new Date(`${item.date}T12:00:00`).getDay()
    rule.hour = hour; rule.minute = minute
    return rule
  }
  if (item.freq === 'monthly') {
    const rule = new schedule.RecurrenceRule()
    rule.date = new Date(`${item.date}T12:00:00`).getDate()
    rule.hour = hour; rule.minute = minute
    return rule
  }
  if (item.freq === 'custom') {
    const n = parseInt(item.cNum, 10) || 1
    const u = item.cUnit ?? 'hours'
    const rule = new schedule.RecurrenceRule()
    if (u === 'minutes') { rule.minute = new schedule.Range(0, 59, n); return rule }
    if (u === 'hours')   { rule.hour = new schedule.Range(0, 23, n); rule.minute = minute; return rule }
    if (u === 'days')    { rule.hour = hour; rule.minute = minute; return rule }
    if (u === 'weeks')   {
      rule.dayOfWeek = new Date(`${item.date}T12:00:00`).getDay()
      rule.hour = hour; rule.minute = minute; return rule
    }
  }
  return new Date(`${item.date}T${item.time}:00`)
}

async function scheduleItem(item) {
  cancelJob(item.id)
  if (item.paused || item.completed) return

  if (item.freq === 'once') {
    const dt = new Date(`${item.date}T${item.time}:00`)
    if (dt <= new Date()) return
  }

  const rule = buildScheduleRule(item)
  const job  = schedule.scheduleJob(rule, async () => {
    try {
      await runAppleScript(item)
      const now = new Date().toISOString()
      notifyRenderer('job:fired', { id: item.id, status: 'sent', lastRun: now })
      showSystemNotification('iMessage sent ✓', `Message to ${item.recipient} was delivered.`)

      const list    = await readJSON('scheduled.json', [])
      const updated = list.map(s => s.id === item.id
        ? { ...s, lastRun: now, ...(item.freq === 'once' ? { completed: true } : {}) }
        : s)
      await writeJSON('scheduled.json', updated)
      if (item.freq === 'once') activeJobs.delete(item.id)
    } catch (err) {
      notifyRenderer('job:fired', { id: item.id, status: 'error', error: err.message })
      showSystemNotification('iMessage failed ✗', `Could not send to ${item.recipient}: ${err.message}`)
    }
  })

  if (job) activeJobs.set(item.id, job)
}

function cancelJob(id) {
  const existing = activeJobs.get(id)
  if (existing) { existing.cancel(); activeJobs.delete(id) }
}

async function restoreJobs() {
  const items = await readJSON('scheduled.json', [])
  let count = 0
  for (const item of items) {
    if (!item.paused && !item.completed) {
      await scheduleItem(item)
      if (activeJobs.has(item.id)) count++
    }
  }
  console.log(`[Scheduler] Restored ${count} active job(s).`)
}

// ── Window ────────────────────────────────────────────────────────────────────

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 820,
    minWidth: 900, minHeight: 600,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'sidebar',
    backgroundColor: '#1c1c1e',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:5173')
      mainWindow.webContents.openDevTools()
    }, 1500)
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// ── IPC: contacts ─────────────────────────────────────────────────────────────
ipcMain.handle('contacts:get',    ()           => readJSON('contacts.json', []))
ipcMain.handle('contacts:save',   (_, c)       => writeJSON('contacts.json', c))
ipcMain.handle('contacts:add',    async (_, contact) => {
  const list = await readJSON('contacts.json', [])
  const item = { ...contact, id: Date.now() }
  list.push(item)
  await writeJSON('contacts.json', list)
  return item
})
ipcMain.handle('contacts:update', async (_, id, patch) => {
  const list    = await readJSON('contacts.json', [])
  const updated = list.map(c => c.id === id ? { ...c, ...patch } : c)
  await writeJSON('contacts.json', updated)
  return updated
})
ipcMain.handle('contacts:delete', async (_, id) => {
  const updated = (await readJSON('contacts.json', [])).filter(c => c.id !== id)
  await writeJSON('contacts.json', updated)
  return updated
})

// ── IPC: scheduled ────────────────────────────────────────────────────────────
ipcMain.handle('scheduled:get',  () => readJSON('scheduled.json', []))
ipcMain.handle('scheduled:save', (_, items) => writeJSON('scheduled.json', items))

ipcMain.handle('scheduled:add', async (_, item) => {
  const list    = await readJSON('scheduled.json', [])
  const newItem = { ...item, id: Date.now() }
  list.push(newItem)
  await writeJSON('scheduled.json', list)
  await scheduleItem(newItem)
  return newItem
})

ipcMain.handle('scheduled:update', async (_, id, patch) => {
  const list    = await readJSON('scheduled.json', [])
  const updated = list.map(s => s.id === id ? { ...s, ...patch } : s)
  await writeJSON('scheduled.json', updated)
  const item = updated.find(s => s.id === id)
  if (item) {
    if (item.paused) cancelJob(id)
    else await scheduleItem(item)
  }
  return updated
})

ipcMain.handle('scheduled:delete', async (_, id) => {
  cancelJob(id)
  const updated = (await readJSON('scheduled.json', [])).filter(s => s.id !== id)
  await writeJSON('scheduled.json', updated)
  return updated
})

// ── IPC: jobs ─────────────────────────────────────────────────────────────────
ipcMain.handle('jobs:active', () => Array.from(activeJobs.keys()))

// ── IPC: system cron ──────────────────────────────────────────────────────────

// Returns all crontab lines as an array of { line, raw } objects.
// Lines that match an imsg script are flagged with { itemId, scriptPath }.
ipcMain.handle('cron:list', () => {
  return new Promise((resolve) => {
    exec('crontab -l 2>/dev/null', (err, stdout) => {
      // crontab -l exits 1 if empty — that's fine, not an error
      const raw   = (stdout || '').trim()
      const lines = raw ? raw.split('\n') : []

      const parsed = lines.map((line, index) => {
        const match = line.match(/osascript\s+(.+imsg_(\d+)\.scpt)/)
        return {
          index,
          raw: line,
          isImsg:     Boolean(match),
          scriptPath: match ? match[1] : null,
          itemId:     match ? Number(match[2]) : null,
        }
      })

      resolve({ lines: parsed, raw })
    })
  })
})

// Remove all crontab entries whose script path contains the given itemId.
// Returns { removed, remaining } — the count removed and the new raw crontab.
ipcMain.handle('cron:kill', (_, itemId) => {
  return new Promise((resolve, reject) => {
    exec('crontab -l 2>/dev/null', (err, stdout) => {
      const raw   = (stdout || '').trim()
      const lines = raw ? raw.split('\n') : []

      const before   = lines.length
      const filtered = lines.filter(l => !l.includes(`imsg_${itemId}.scpt`))
      const removed  = before - filtered.length

      if (removed === 0) {
        return resolve({ removed: 0, remaining: raw })
      }

      // Write filtered crontab back
      const newCrontab = filtered.join('\n') + (filtered.length ? '\n' : '')
      const child = require('child_process').spawn('crontab', ['-'], { stdio: ['pipe', 'pipe', 'pipe'] })
      child.stdin.write(newCrontab)
      child.stdin.end()

      child.on('close', (code) => {
        if (code === 0) resolve({ removed, remaining: newCrontab })
        else reject(new Error(`crontab write failed with code ${code}`))
      })
    })
  })
})

// Kill every imsg_ cron entry regardless of itemId (full wipe).
ipcMain.handle('cron:killAll', () => {
  return new Promise((resolve, reject) => {
    exec('crontab -l 2>/dev/null', (err, stdout) => {
      const raw     = (stdout || '').trim()
      const lines   = raw ? raw.split('\n') : []
      const filtered = lines.filter(l => !l.includes('imsg_'))
      const removed  = lines.length - filtered.length

      const newCrontab = filtered.join('\n') + (filtered.length ? '\n' : '')
      if (removed === 0) return resolve({ removed: 0 })

      const child = require('child_process').spawn('crontab', ['-'], { stdio: ['pipe', 'pipe', 'pipe'] })
      child.stdin.write(newCrontab)
      child.stdin.end()
      child.on('close', (code) => {
        if (code === 0) resolve({ removed })
        else reject(new Error(`crontab write failed with code ${code}`))
      })
    })
  })
})

// ── IPC: settings ─────────────────────────────────────────────────────────────
ipcMain.handle('settings:get', () =>
  readJSON('settings.json', {
    scriptPath: '~/imsg_scripts/', macVersion: 'macOS 15 Sequoia',
    showSleepNote: true, showDeliveryNote: true, confirmDelete: true,
  })
)
ipcMain.handle('settings:save', (_, s) => writeJSON('settings.json', s))

// ── Lifecycle ─────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  createWindow()
  await restoreJobs()
})

app.on('window-all-closed', () => {
  for (const job of activeJobs.values()) job.cancel()
  activeJobs.clear()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    restoreJobs()
  }
})
