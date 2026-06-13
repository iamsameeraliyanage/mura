import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import { RequireAuth } from './components/RequireAuth'
import { AppShell } from './components/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StaffPage from './pages/admin/Staff'
import OrganisationPage from './pages/admin/Organisation'
import { RosterRoute } from './pages/roster/RosterPage'
import FairnessPage from './pages/Fairness'
import UnavailabilityPage from './pages/Unavailability'
import SharePage from './pages/Share'
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
              { path: 'roster/:layer', element: <RosterRoute /> },
              { path: 'fairness', element: <FairnessPage /> },
              { path: 'unavailability', element: <UnavailabilityPage /> },
              { path: 'share', element: <SharePage /> },
              { path: 'audit', element: <AuditPage /> },
              {
                element: (
                  <RequireAuth roles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DEPARTMENT_ADMIN']} />
                ),
                children: [{ path: 'admin/staff', element: <StaffPage /> }],
              },
              {
                element: <RequireAuth roles={['SUPER_ADMIN', 'HOSPITAL_ADMIN']} />,
                children: [{ path: 'admin/organisation', element: <OrganisationPage /> }],
              },
            ],
          },
        ],
      },
    ],
  },
])
