const ICONS = { success: '✅', error: '❌', info: 'ℹ️' }

export default function ToastList({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span>{ICONS[t.type] ?? 'ℹ️'}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
