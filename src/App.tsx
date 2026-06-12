import { Outlet } from 'react-router-dom'
import { ToastProvider } from './components/ui'

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-dvh">
        <Outlet />
      </div>
    </ToastProvider>
  )
}
