# iMessage Command Center

Schedule iMessages and SMS messages to anyone from your Mac — built with Electron, React, and Vite.

---

## Features

**Messaging**
- Schedule iMessage or SMS (via iPhone Continuity) to one or multiple recipients at once
- Message sequences — send multiple messages to a recipient in order
- Frequency options: once, hourly, daily, weekdays (Mon–Fri), weekends (Sat–Sun), weekly, monthly, or a custom interval
- In-app scheduler (node-schedule) fires messages automatically while the app is open
- AppleScript + cron/at scripts generated for each job as a fallback when the app is closed

**Queue & History**
- Active messages displayed in the Queue, sorted chronologically (soonest first)
- Completed messages move automatically to History with search
- Pause / resume individual jobs without deleting them
- Edit any scheduled message (recipient, type, messages, date/time, frequency) without rescheduling from scratch
- System Cron Manager — read, inspect, and kill macOS crontab entries directly from the app

**Contacts**
- Save contacts with name, phone/Apple ID, color, and an optional photo
- Card view (grid) or List view (table) — toggle between them
- Contacts sorted alphabetically in both views
- Multi-select: select one or more contacts to bulk-delete or bulk-message
- Contact lookup in the Compose recipient field with live name filtering and match highlighting
- Contact avatars and names shown on queue cards wherever a phone/handle matches

**Dashboard**
- Six stat tiles: total scheduled, recurring, recipients, saved contacts, jobs completed, jobs failed
- Recent failure log with error message and timestamp
- Upcoming messages sorted chronologically

---

## Project Structure

```
imsg-command-center/
├── main.js              ← Electron main process: window, IPC handlers, file I/O,
│                           node-schedule job runner, AppleScript executor
├── preload.js           ← contextBridge — exposes electronAPI to React safely
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx         ← React entry point
    ├── App.jsx          ← Layout shell + view router
    ├── styles/
    │   └── global.css   ← Design tokens, shared component styles
    ├── context/
    │   └── AppContext.jsx    ← Global state: contacts, scheduled, settings,
    │                            activeJobs, failedJobs, toast, prefill
    ├── hooks/
    │   ├── useStorage.js     ← Electron IPC ↔ localStorage abstraction layer
    │   └── useToast.js
    ├── utils/
    │   ├── helpers.js        ← freqLabel, cronExpr, initials, colorForName,
    │                            AVATAR_COLORS, PLATFORMS
    │   └── scriptGen.js      ← AppleScript + cron/at setup instructions generator
    ├── components/
    │   ├── Titlebar.jsx
    │   ├── Sidebar.jsx
    │   ├── Toast.jsx
    │   ├── Modal.jsx
    │   ├── AddContactModal.jsx      ← Add and edit contacts; supports photo upload
    │   ├── EditScheduledModal.jsx   ← Edit a scheduled message in-place
    │   └── shared/
    │       ├── StatCard.jsx         ← Metric tile used on Dashboard
    │       ├── QueueItem.jsx        ← Queue card with multi-recipient display,
    │       │                           status dot, script panel, edit/pause/delete
    │       ├── ScriptPanel.jsx      ← Expandable AppleScript + setup instructions
    │       └── CronManager.jsx      ← System crontab inspector and job killer
    └── views/
        ├── Dashboard.jsx    ← Stats, failure log, upcoming messages
        ├── Compose.jsx      ← Multi-recipient scheduling form with live preview
        ├── Queue.jsx        ← Active messages (non-completed), chronological sort
        ├── History.jsx      ← Completed messages with search
        ├── Contacts.jsx     ← Card/list views, alphabetical sort, multi-select
        └── Settings.jsx     ← Behavior toggles, script path, macOS version, data export
```

---

## First-time Setup

```bash
cd imsg-command-center
npm install
```

---

## Development

Open two terminal tabs:

```bash
# Tab 1 — React dev server with hot reload
npm run dev:react

# Tab 2 — Electron window (points at localhost:5173)
npm run dev:electron
```

Every file save in `src/` updates the app instantly. The only time you need to restart Electron is when editing `main.js` or `preload.js`.

### Where to make common changes

| What you want to change                         | File                                    |
|-------------------------------------------------|-----------------------------------------|
| Scheduling form, recipients, frequency options  | `src/views/Compose.jsx`                 |
| Queue display, filters, sort order              | `src/views/Queue.jsx`                   |
| Message history                                 | `src/views/History.jsx`                 |
| Dashboard stats and upcoming list               | `src/views/Dashboard.jsx`               |
| Contact card/list views, multi-select           | `src/views/Contacts.jsx`                |
| Settings toggles and script path                | `src/views/Settings.jsx`                |
| Frequency labels and cron expressions           | `src/utils/helpers.js`                  |
| AppleScript output and setup instructions       | `src/utils/scriptGen.js`                |
| Colors, fonts, spacing                          | `src/styles/global.css`                 |
| Global state, actions, job event handling       | `src/context/AppContext.jsx`            |
| In-app job scheduler and AppleScript execution  | `main.js` → `buildAppleScript`, `scheduleItem` |
| IPC data persistence (contacts, scheduled, etc) | `main.js` → `ipcMain.handle` blocks     |
| What React can call from Electron               | `preload.js`                            |
| Window size, native macOS options               | `main.js` → `createWindow()`           |

---

## Build a DMG

```bash
npm run build   # bundles React into dist/
npm run dmg     # packages into a .dmg in dist/mac/
```

To test the packaged app without creating a DMG:
```bash
npm run pack
```

> **Note:** macOS may block the app with "unidentified developer" since it isn't signed. Right-click the app → **Open** → **Open anyway**, or run:
> ```bash
> xattr -cr "/Applications/iMessage Command Center.app"
> ```

---

## Data Storage

All data persists as JSON files in:
```
~/Library/Application Support/iMessage Command Center/
├── contacts.json    ← saved contacts (name, handle, color, photo as base64)
├── scheduled.json   ← all scheduled messages (active and completed)
└── settings.json    ← user preferences
```

These files can be backed up, inspected, or hand-edited at any time. The **Settings → Export JSON** button downloads a combined backup of all three.

---

## How messages actually send

### While the app is open — automatic (node-schedule)
Messages scheduled via the app are registered with `node-schedule` in the Electron main process. When the scheduled time arrives, `osascript` runs the AppleScript inline and the message fires without any extra setup. On app relaunch, all active non-completed jobs are automatically re-registered from `scheduled.json`.

> **First-time permission:** macOS will prompt *"iMessage Command Center wants to control Messages"* on the first send. Click **OK**. If you miss it, enable it under **System Settings → Privacy & Security → Automation**.

### While the app is closed — cron/at fallback
Each queue item has a **View Script** button that generates a ready-to-run AppleScript with step-by-step Terminal instructions:
- **One-time jobs** → scheduled with the `at` command
- **Recurring jobs** → added to `crontab` with the generated cron expression

The **System Cron Jobs** panel at the bottom of the Queue view lets you inspect and kill crontab entries without opening Terminal.

### Frequency → cron expression reference

| Option | Cron expression |
|---|---|
| Every hour | `{min} * * * *` |
| Every day | `{min} {hr} * * *` |
| Weekdays (Mon–Fri) | `{min} {hr} * * 1-5` |
| Weekends (Sat–Sun) | `{min} {hr} * * 0,6` |
| Every week | `{min} {hr} * * {dow}` |
| Every month | `{min} {hr} {day} * *` |

### SMS requirements
SMS messages route through your iPhone via **Continuity**. On your iPhone: **Settings → Messages → Text Message Forwarding** → enable your Mac. Both devices must be on the same Wi-Fi network and signed into the same Apple ID.

---

## macOS Permissions Required

| Permission | Why |
|---|---|
| Automation → Messages | Required to send messages via AppleScript |
| Notifications | Optional — system notification shown on each send/fail |
