export default function Titlebar() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 44,
      background: 'rgba(28,28,30,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', padding: '0 16px',
      zIndex: 100,
      WebkitAppRegion: 'drag',
      userSelect: 'none',
    }}>
      {/* Traffic lights — cosmetic only in browser, functional in Electron */}
      <div style={{ display:'flex', gap:7, WebkitAppRegion:'no-drag' }}>
        {['#ff5f57','#ffbd2e','#28c940'].map((bg, i) => (
          <div key={i} style={{
            width:13, height:13, borderRadius:'50%', background: bg, cursor:'pointer',
          }} />
        ))}
      </div>

      <div style={{
        flex: 1, textAlign: 'center',
        fontSize: 13, fontWeight: 500, color: 'var(--text2)',
        letterSpacing: '-0.01em',
      }}>
        iMessage Command Center
      </div>

      {/* Spacer to balance traffic lights */}
      <div style={{ width: 50 }} />
    </div>
  )
}
