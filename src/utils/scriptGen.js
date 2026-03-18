import { cronExpr } from './helpers'

export function generateScript(item, settings = {}) {
  const sp          = (settings.scriptPath ?? '~/imsg_scripts/').replace(/\/$/, '')
  const scriptPath  = `${sp}/imsg_${item.id}.scpt`
  const isSMS       = item.msgType === 'sms'
  const serviceType = isSMS ? 'SMS' : 'iMessage'
  const channelName = isSMS ? 'SMS (via iPhone Continuity)' : 'iMessage'

  // Support both single recipient (legacy) and recipients array
  const allRecipients = item.recipients?.length
    ? item.recipients
    : [item.recipient].filter(Boolean)

  const escAS = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const sends = allRecipients.flatMap(rec =>
    (item.messages ?? []).map(m =>
      `  set targetBuddy to buddy "${escAS(rec)}" of targetService\n  send "${escAS(m)}" to targetBuddy`
    )
  ).join('\n')

  const recipientLabel = allRecipients.length === 1
    ? allRecipients[0]
    : `${allRecipients[0]} (+${allRecipients.length - 1} more)`

  const deliveryNote = settings.showDeliveryNote !== false
    ? isSMS
      ? `-- NOTE: Messages.app must be open. Your iPhone must be on the same\n-- network as your Mac with Continuity enabled for SMS to work.\n`
      : `-- NOTE: Messages.app must be open & signed into iMessage.\n`
    : ''

  const sleepNote = settings.showSleepNote !== false
    ? `\n-- TIP: Prevent sleep → System Settings → Battery → Prevent automatic sleep`
    : ''

  const applescript = [
    `-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `-- iMessage Command Center — AppleScript`,
    `-- Channel    : ${channelName}`,
    `-- Recipients : ${allRecipients.join(', ')}`,
    `-- Scheduled  : ${item.date} at ${item.time}`,
    `-- Frequency  : ${item.flabel}`,
    `-- Script ID  : ${item.id}`,
    `-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    deliveryNote,
    `tell application "Messages"`,
    `  set targetService to 1st service whose service type = ${serviceType}`,
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
