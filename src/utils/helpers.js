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
    once:    'Once',
    hourly:  'Every hour',
    daily:   'Daily',
    weekly:  'Weekly',
    monthly: 'Monthly',
  }
  return map[freq] ?? `Every ${cNum} ${cUnit}`
}

export const cronExpr = ({ freq, time, date, cNum, cUnit }) => {
  const [h, m] = (time ?? '09:00').split(':')
  if (freq === 'hourly')  return `${m} * * * *`
  if (freq === 'daily')   return `${m} ${h} * * *`
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

export const AVATAR_COLORS = [
  '#0a84ff', '#30d158', '#ff9f0a',
  '#bf5af2', '#ff453a', '#32d2ff',
]

export const colorForName = (name = '') => {
  const idx = (name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}
