import { Outlet } from 'react-router-dom'
import { ToastProvider } from './components/ui'
import { ScopeProvider } from './lib/scope'

export default function App() {
  return (
    <ToastProvider>
      <ScopeProvider>
        <div className="min-h-dvh">
          <Outlet />
        </div>
      </ScopeProvider>
    </ToastProvider>
  )
}
