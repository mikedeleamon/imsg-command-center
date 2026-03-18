export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export const initials = (name) =>
  String(name ?? '?')
    .trim()
    .split(/\s+/)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

export const freqLabel = (freq, cNum, cUnit) => {
  const map = {
    once:     'Once',
    hourly:   'Every hour',
    daily:    'Daily',
    weekdays: 'Weekdays (Mon–Fri)',
    weekends: 'Weekends (Sat–Sun)',
    weekly:   'Weekly',
    monthly:  'Monthly',
  }
  return map[freq] ?? `Every ${cNum} ${cUnit}`
}

export const cronExpr = ({ freq, time, date, cNum, cUnit }) => {
  const [h, m] = (time ?? '09:00').split(':')
  if (freq === 'hourly')   return `${m} * * * *`
  if (freq === 'daily')    return `${m} ${h} * * *`
  if (freq === 'weekdays') return `${m} ${h} * * 1-5`
  if (freq === 'weekends') return `${m} ${h} * * 0,6`
  if (freq === 'weekly') {
    const d = new Date((date ?? '') + 'T12:00:00').getDay()
    return `${m} ${h} * * ${d}`
  }
  if (freq === 'monthly') {
    const day = new Date((date ?? '') + 'T12:00:00').getDate()
    return `${m} ${h} ${day} * *`
  }
  if (freq === 'custom') {
    if (cUnit === 'minutes') return `*/${cNum} * * * *`
    if (cUnit === 'hours')   return `0 */${cNum} * * *`
    if (cUnit === 'days')    return `${m} ${h} */${cNum} * *`
    if (cUnit === 'weeks')   return `${m} ${h} * * */${cNum}`
  }
  return ''
}

export const PLATFORMS = {
  imessage: {
    id:        'imessage',
    label:     'iMessage',
    icon:      '💬',
    color:     '#0a84ff',
    bgColor:   'rgba(10,132,255,0.15)',
    hint:      'Requires Apple ID / iMessage account',
  },
  sms: {
    id:        'sms',
    label:     'SMS',
    icon:      '📱',
    color:     '#30d158',
    bgColor:   'rgba(48,209,88,0.15)',
    hint:      'Requires iPhone paired via Continuity (same Apple ID, same Wi-Fi)',
  },
  whatsapp: {
    id:        'whatsapp',
    label:     'WhatsApp',
    icon:      '🟢',
    color:     '#25d366',
    bgColor:   'rgba(37,211,102,0.15)',
    hint:      'Requires WhatsApp Desktop installed. Phone number must include country code (e.g. +1 555…)',
  },
}

export const AVATAR_COLORS = [
  '#0a84ff', '#30d158', '#ff9f0a',
  '#bf5af2', '#ff453a', '#32d2ff',
]

export const colorForName = (name = '') => {
  const idx = (name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}
