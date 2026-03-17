import { cronExpr } from './helpers'

export function generateScript(item, settings = {}) {
  const sp = (settings.scriptPath ?? '~/imsg_scripts/').replace(/\/$/, '')
  const scriptPath = `${sp}/imsg_${item.id}.scpt`
  const rec = String(item.recipient ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const sends = (item.messages ?? [])
    .map(m => `  send "${String(m).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" to targetBuddy`)
    .join('\n')

  const deliveryNote = settings.showDeliveryNote !== false
    ? `-- NOTE: Messages.app must be open & signed into iMessage.\n`
    : ''

  const sleepNote = settings.showSleepNote !== false
    ? `\n-- TIP: Prevent sleep → System Settings → Battery → Prevent automatic sleep`
    : ''

  const applescript = [
    `-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `-- iMessage Command Center — AppleScript`,
    `-- Recipient : ${item.recipient}`,
    `-- Scheduled : ${item.date} at ${item.time}`,
    `-- Frequency : ${item.flabel}`,
    `-- Script ID : ${item.id}`,
    `-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    deliveryNote,
    `tell application "Messages"`,
    `  set targetService to 1st service whose service type = iMessage`,
    `  set targetBuddy to buddy "${rec}" of targetService`,
    sends,
    `end tell`,
  ].join('\n')

  const isOnce = item.freq === 'once'

  const setup = isOnce
    ? [
        ``,
        `━━━━  SETUP — One-time  ━━━━`,
        ``,
        `1. Open Script Editor (Utilities → Script Editor)`,
        `   Paste the script above and save to:`,
        `   ${scriptPath}`,
        ``,
        `2. Enable the at daemon (first time only):`,
        `   sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.atrun.plist`,
        ``,
        `3. Schedule in Terminal:`,
        `   echo "osascript ${scriptPath}" | at ${item.time} ${item.date}`,
        ``,
        `4. Verify: atq      Cancel: atrm <job_number>`,
        sleepNote,
      ].join('\n')
    : [
        ``,
        `━━━━  SETUP — Recurring (cron)  ━━━━`,
        ``,
        `1. Open Script Editor, paste the script above, save to:`,
        `   ${scriptPath}`,
        ``,
        `2. Open crontab:`,
        `   crontab -e`,
        ``,
        `3. Press i, add this line, then Esc → :wq`,
        `   ${cronExpr(item)} osascript ${scriptPath}`,
        ``,
        `4. Verify: crontab -l`,
        `   Remove: crontab -e → delete the line`,
        sleepNote,
      ].join('\n')

  return applescript + '\n' + setup
}
