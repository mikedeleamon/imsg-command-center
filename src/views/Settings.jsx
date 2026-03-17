import { useApp } from '../context/AppContext'
import { storage } from '../hooks/useStorage'

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 0', borderBottom:'1px solid var(--border2)',
    }}>
      <div style={{ flex:1, paddingRight:24 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.4 }}>{desc}</div>
      </div>
      <button
        className={`toggle${value ? ' on' : ''}`}
        onClick={() => onChange(!value)}
      />
    </div>
  )
}

export default function Settings() {
  const { settings, updateSettings, scheduled, contacts, toast } = useApp()

  const exportData = () => {
    const data = JSON.stringify({ scheduled, contacts, settings }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'imsg_commandcenter_backup.json'
    a.click()
    toast('Data exported', 'success')
  }

  const clearAll = async () => {
    if (!window.confirm('Delete all scheduled messages and contacts? This cannot be undone.')) return
    await storage.saveContacts([])
    await storage.saveScheduled([])
    window.location.reload()
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-.03em' }}>Settings</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>Customize your command center</div>
      </div>

      {/* Behavior */}
      <div className="card">
        <div className="card-header"><div className="card-title">Behavior</div></div>

        <ToggleRow
          label="Confirm before deleting"
          desc="Show a confirmation dialog before removing scheduled messages or contacts"
          value={settings.confirmDelete}
          onChange={v => updateSettings({ confirmDelete: v })}
        />
        <ToggleRow
          label="Show delivery note in script"
          desc="Include a reminder that Messages.app must be open when scripts run"
          value={settings.showDeliveryNote}
          onChange={v => updateSettings({ showDeliveryNote: v })}
        />
        <ToggleRow
          label="Show sleep-prevention tip"
          desc="Append a caffeinate / Energy Saver tip in generated scripts"
          value={settings.showSleepNote}
          onChange={v => updateSettings({ showSleepNote: v })}
        />
      </div>

      {/* Script output */}
      <div className="card">
        <div className="card-header"><div className="card-title">Script Output</div></div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border2)' }}>
          <div style={{ flex:1, paddingRight:24 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>Script save path</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Where AppleScript files will be saved on your Mac</div>
          </div>
          <input
            type="text"
            value={settings.scriptPath ?? '~/imsg_scripts/'}
            onChange={e => updateSettings({ scriptPath: e.target.value })}
            style={{ width:200 }}
          />
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0' }}>
          <div style={{ flex:1, paddingRight:24 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>macOS version</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Adjusts cron vs launchd recommendations in scripts</div>
          </div>
          <select
            value={settings.macVersion ?? 'macOS 15 Sequoia'}
            onChange={e => updateSettings({ macVersion: e.target.value })}
            style={{ width:180 }}
          >
            <option>macOS 15 Sequoia</option>
            <option>macOS 14 Sonoma</option>
            <option>macOS 13 Ventura</option>
            <option>macOS 12 Monterey</option>
          </select>
        </div>
      </div>

      {/* Data */}
      <div className="card">
        <div className="card-header"><div className="card-title">Data</div></div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border2)' }}>
          <div style={{ flex:1, paddingRight:24 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>Export backup</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>
              Download a JSON file with all scheduled messages, contacts, and settings
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={exportData}>Export JSON</button>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0' }}>
          <div style={{ flex:1, paddingRight:24 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>Clear all data</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>
              Permanently delete all scheduled messages and saved contacts
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={clearAll}>Clear all</button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="card-header"><div className="card-title">About</div></div>
        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:2 }}>
          <div>iMessage Command Center <span style={{color:'var(--text2)'}}>v1.0.0</span></div>
          <div>Built with Electron + React + Vite</div>
          <div>Data stored in: <code style={{fontFamily:'var(--mono)', fontSize:11, color:'var(--text2)'}}>~/Library/Application Support/iMessage Command Center/</code></div>
        </div>
      </div>
    </div>
  )
}
