import { AppProvider, useApp } from './context/AppContext'
import Titlebar  from './components/Titlebar'
import Sidebar   from './components/Sidebar'
import ToastList from './components/Toast'
import Dashboard from './views/Dashboard'
import Compose   from './views/Compose'
import Queue     from './views/Queue'
import Contacts  from './views/Contacts'
import Settings  from './views/Settings'

const VIEWS = { dashboard: Dashboard, compose: Compose, queue: Queue, contacts: Contacts, settings: Settings }

function AppShell() {
  const { activeView, toasts, loading } = useApp()
  const View = VIEWS[activeView] ?? Dashboard

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                    height:'100vh', color:'var(--text3)', fontSize:13 }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      <Titlebar />
      <div style={{ display:'flex', flex:1, overflow:'hidden', paddingTop:44 }}>
        <Sidebar />
        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden', background:'var(--bg0)' }}>
          <div style={{ padding:'28px 32px', maxWidth:920 }}>
            <View />
          </div>
        </main>
      </div>
      <ToastList toasts={toasts} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
