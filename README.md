# iMessage Command Center

Schedule iMessages to anyone from your Mac — built with Electron, React, and Vite.

---

## Project Structure

```
imsg-command-center/
├── main.js              ← Electron main process (window + IPC + file I/O)
├── preload.js           ← Secure IPC bridge exposed to React via contextBridge
├── package.json
├── vite.config.js
├── index.html           ← Vite entry point
└── src/
    ├── main.jsx         ← React mount
    ├── App.jsx          ← Root layout shell + view router
    ├── styles/
    │   └── global.css
    ├── context/
    │   └── AppContext.jsx    ← Global state: contacts, scheduled, settings
    ├── hooks/
    │   ├── useStorage.js     ← Electron IPC ↔ localStorage abstraction
    │   └── useToast.js
    ├── utils/
    │   ├── helpers.js        ← initials, freqLabel, cronExpr, colors
    │   └── scriptGen.js      ← AppleScript + Terminal setup generator
    ├── components/
    │   ├── Titlebar.jsx
    │   ├── Sidebar.jsx
    │   ├── Toast.jsx
    │   ├── Modal.jsx
    │   ├── AddContactModal.jsx
    │   └── shared/
    │       ├── StatCard.jsx
    │       ├── QueueItem.jsx
    │       └── ScriptPanel.jsx
    └── views/
        ├── Dashboard.jsx
        ├── Compose.jsx
        ├── Queue.jsx
        ├── Contacts.jsx
        └── Settings.jsx
```

---

## First-time Setup

```bash
cd imsg-command-center
npm install
```

---

## Development — making updates

Open two terminal tabs:

```bash
# Tab 1 — React dev server (hot reload on every file save)
npm run dev:react

# Tab 2 — Electron window (loads localhost:5173)
npm run dev:electron
```

Now edit any file in `src/` and the app updates instantly without restarting.

### Where to make common changes

| What you want to change          | File                              |
|----------------------------------|-----------------------------------|
| Scheduling form / logic          | `src/views/Compose.jsx`           |
| Queue list display               | `src/views/Queue.jsx`             |
| Dashboard stats                  | `src/views/Dashboard.jsx`         |
| Contact management               | `src/views/Contacts.jsx`          |
| Settings toggles                 | `src/views/Settings.jsx`          |
| AppleScript output               | `src/utils/scriptGen.js`          |
| Colors, fonts, spacing           | `src/styles/global.css`           |
| Global state / data actions      | `src/context/AppContext.jsx`       |
| IPC data persistence             | `main.js`                         |
| What React can call in Electron  | `preload.js`                      |
| Window size, native options      | `main.js` → `createWindow()`      |

---

## Build a DMG

```bash
npm run build   # bundles React into dist/
npm run dmg     # packages into a .dmg in dist/
```

Your `.dmg` appears in `dist/mac/`.

To just test the packaged build without DMG:
```bash
npm run pack
```

---

## Data Storage

All data is persisted as JSON files in:
```
~/Library/Application Support/iMessage Command Center/
├── contacts.json
├── scheduled.json
└── settings.json
```

You can back these up, inspect them, or hand-edit them at any time.

---

## How messages actually send

The app generates AppleScript + cron/at instructions. To activate sending:

1. Click **View Script** on any queue item
2. Copy the AppleScript → paste into **Script Editor.app** → save to the path shown
3. Follow the Terminal steps in the script (one-time uses `at`, recurring uses `cron`)
4. Keep your Mac awake during scheduled send times

> Messages.app must be open and signed into iMessage for scripts to work.
