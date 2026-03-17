import { useState, useEffect, useCallback } from 'react'
import { storage } from '../../hooks/useStorage'
import { useApp } from '../../context/AppContext'

function CronRow({ entry, scheduled, onKill }) {
  const [killing, setKilling] = useState(false)

  // Match the cron entry to a known scheduled item if possible
  const matched = scheduled.find(s => s.id === entry.itemId)

  const handleKill = async () => {
    setKilling(true)
    try {
      await onKill(entry.itemId)
    } finally {
      setKilling(false)
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 0', borderBottom: '1px solid var(--border2)',
    }}>
      {/* Status dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: entry.isImsg ? 'var(--green)' : 'var(--text3)',
        flexShrink: 0, marginTop: 5,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Matched item info */}
        {matched && (
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
            → {matched.recipient}
            <span style={{ fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>
              {matched.flabel}
            </span>
          </div>
        )}
        {/* Raw cron line */}
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)',
          wordBreak: 'break-all', lineHeight: 1.5,
          padding: '6px 10px', background: 'var(--bg0)',
          borderRadius: 'var(--radius-xs)',
        }}>
          {entry.raw}
        </div>
      </div>

      {/* Kill button — only show for imsg entries */}
      {entry.isImsg && (
        <button
          className="btn btn-danger btn-sm"
          style={{ flexShrink: 0 }}
          onClick={handleKill}
          disabled={killing}
        >
          {killing ? 'Removing…' : 'Kill'}
        </button>
      )}
    </div>
  )
}

export default function CronManager() {
  const { scheduled, toast } = useApp()
  const [cronData,   setCronData]   = useState(null)   // { lines, raw }
  const [loading,    setLoading]    = useState(false)
  const [expanded,   setExpanded]   = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await storage.listCronJobs()
      setCronData(data)
    } catch (err) {
      toast(`Could not read crontab: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Auto-load when expanded
  useEffect(() => {
    if (expanded && !cronData) refresh()
  }, [expanded, cronData, refresh])

  const handleKill = async (itemId) => {
    try {
      const result = await storage.killCronJob(itemId)
      if (result.removed > 0) {
        toast(`Cron job removed from system crontab`, 'success')
        await refresh()
      } else {
        toast('No matching cron entry found — was it already removed?', 'info')
      }
    } catch (err) {
      toast(`Failed to kill cron job: ${err.message}`, 'error')
    }
  }

  const handleKillAll = async () => {
    if (!window.confirm('Remove ALL iMessage cron jobs from your system crontab? This cannot be undone.')) return
    try {
      const result = await storage.killAllCronJobs()
      toast(`Removed ${result.removed} cron job${result.removed !== 1 ? 's' : ''}`, 'success')
      await refresh()
    } catch (err) {
      toast(`Failed: ${err.message}`, 'error')
    }
  }

  const imsgLines  = cronData?.lines.filter(l => l.isImsg) ?? []
  const otherLines = cronData?.lines.filter(l => !l.isImsg) ?? []
  const totalLines = cronData?.lines.length ?? 0

  return (
    <div style={{
      border: '1px solid var(--border2)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      {/* Header / toggle */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', cursor: 'pointer',
          background: 'var(--surface)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>🖥️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              System Cron Jobs
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
              {cronData
                ? `${imsgLines.length} iMessage job${imsgLines.length !== 1 ? 's' : ''} in crontab`
                : 'Click to inspect your system crontab'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {imsgLines.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: 'rgba(48,209,88,0.15)', color: 'var(--green)',
              border: '1px solid rgba(48,209,88,0.3)',
            }}>
              {imsgLines.length} active
            </span>
          )}
          <span style={{ color: 'var(--text3)', fontSize: 12, transition: 'transform .2s',
                         display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            ▾
          </span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border2)' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderBottom: '1px solid var(--border2)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              {loading ? 'Reading crontab…' : `${totalLines} total line${totalLines !== 1 ? 's' : ''} in crontab`}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {imsgLines.length > 1 && (
                <button className="btn btn-danger btn-sm" onClick={handleKillAll}>
                  Kill all iMessage jobs
                </button>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={refresh}
                disabled={loading}
              >
                {loading ? '…' : '↻ Refresh'}
              </button>
            </div>
          </div>

          <div style={{ padding: '0 16px' }}>
            {/* No crontab at all */}
            {cronData && totalLines === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center',
                            fontSize: 12, color: 'var(--text3)', lineHeight: 2 }}>
                Your crontab is empty — no system cron jobs exist yet.<br/>
                Use the <b style={{ color: 'var(--text2)' }}>View Script</b> button on a queued message to set one up.
              </div>
            )}

            {/* iMessage cron entries */}
            {imsgLines.length > 0 && (
              <>
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '.06em',
                  color: 'var(--text3)', textTransform: 'uppercase',
                  padding: '12px 0 4px',
                }}>
                  iMessage Jobs ({imsgLines.length})
                </div>
                {imsgLines.map((entry, i) => (
                  <CronRow
                    key={i}
                    entry={entry}
                    scheduled={scheduled}
                    onKill={handleKill}
                  />
                ))}
              </>
            )}

            {/* Other (non-imsg) cron entries — shown read-only for context */}
            {otherLines.length > 0 && (
              <>
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '.06em',
                  color: 'var(--text3)', textTransform: 'uppercase',
                  padding: '12px 0 4px', marginTop: imsgLines.length ? 8 : 0,
                }}>
                  Other cron entries ({otherLines.length}) — read only
                </div>
                {otherLines.map((entry, i) => (
                  <CronRow
                    key={i}
                    entry={entry}
                    scheduled={scheduled}
                    onKill={() => {}}
                  />
                ))}
              </>
            )}

            {/* Loading state */}
            {loading && !cronData && (
              <div style={{ padding: '20px 0', textAlign: 'center',
                            fontSize: 12, color: 'var(--text3)' }}>
                Reading system crontab…
              </div>
            )}
          </div>

          {/* Footer note */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid var(--border2)',
            fontSize: 11, color: 'var(--text3)', lineHeight: 1.6,
          }}>
            💡 Killing a cron job removes it from your system crontab. The message will remain
            in the queue above and can be re-scheduled at any time.
          </div>
        </div>
      )}
    </div>
  )
}
