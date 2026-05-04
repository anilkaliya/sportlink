import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Nav } from './components/Nav/Nav'
import { DashboardPage } from './pages/DashboardPage/DashboardPage'
import { ProfilePage } from './pages/ProfilePage/ProfilePage'
import { AthletesPage } from './pages/AthletesPage/AthletesPage'
import { RequestsPage } from './pages/RequestsPage/RequestsPage'
import { RegisterPage } from './pages/RegisterPage/RegisterPage'
import { SignInPage } from './pages/SignInPage/SignInPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage'

const AUTH_PATHS = ['/register', '/signin', '/forgot-password']

function Layout() {
  const location = useLocation()
  const isAuthPage = AUTH_PATHS.some(p => location.pathname.startsWith(p))
  return (
    <>
      {!isAuthPage && <Nav />}
      <Outlet />
    </>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/dashboard"        element={<DashboardPage />} />
          <Route path="/profile/:id"     element={<ProfilePage />} />
          <Route path="/athletes"              element={<AthletesPage />} />
          <Route path="/connections/requests"  element={<RequestsPage />} />
          <Route path="/"                element={<Navigate to="/signin" replace />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/signin"          element={<SignInPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
