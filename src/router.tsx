import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import { RequireAuth } from './components/RequireAuth'
import { AppShell } from './components/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StaffPage from './pages/admin/Staff'
import SettingsPage from './pages/admin/Settings'
import RosterPage from './pages/roster/RosterPage'
import AuditPage from './pages/Audit'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: 'login', element: <Login /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'roster/consultant', element: <RosterPage layer="CONSULTANT" /> },
              { path: 'roster/sho', element: <RosterPage layer="SHO" /> },
              { path: 'audit', element: <AuditPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireAuth roles={['ADMIN']} />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: 'admin/staff', element: <StaffPage /> },
              { path: 'admin/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])
