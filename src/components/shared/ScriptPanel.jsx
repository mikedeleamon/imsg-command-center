import { useState } from 'react'
import { generateScript } from '../../utils/scriptGen'
import { useApp } from '../../context/AppContext'

export default function ScriptPanel({ item }) {
  const { settings, toast } = useApp()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const script = open ? generateScript(item, settings) : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateScript(item, settings))
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
    toast('Script copied to clipboard', 'success')
  }

  const handleDownload = () => {
    const blob = new Blob([generateScript(item, settings)], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `imsg_${item.id}_script.txt`
    a.click()
    toast('Script downloaded', 'info')
  }

  return (
    <div>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(o => !o)}
        style={{ fontSize: 11 }}
      >
        {open ? 'Hide script' : 'View script'}
      </button>

      {open && (
        <div style={{
          borderTop: '1px solid var(--border2)', marginTop: 10,
          paddingTop: 12,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.06em',
            color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8,
          }}>
            AppleScript + Setup
          </div>
          <div style={{
            background: 'var(--bg0)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius-xs)', padding: '12px 14px',
            fontFamily: 'var(--mono)', fontSize: 11.5, lineHeight: 1.7,
            color: '#e5e5ea', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: 280, overflowY: 'auto',
          }}>
            {script}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleDownload}>
              ⬇ Download
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
