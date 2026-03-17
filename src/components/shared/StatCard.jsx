export default function StatCard({ value, label, color }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border2)',
      borderRadius: 'var(--radius)', padding: '16px 18px',
    }}>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.04em',
                    color: color ?? 'var(--text)', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</div>
    </div>
  )
}
