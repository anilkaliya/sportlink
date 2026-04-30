import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { userApi } from '../../api/user'
import styles from './Nav.module.css'

export function Nav() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await userApi.logout()
    } catch {
      // proceed regardless — clear local state and redirect
    }
    clearAuth()
    navigate('/signin')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span className={styles.logoAccent}>SPORT</span>
          <span className={styles.logoText}>LINK</span>
        </div>
        <div className={styles.tabs}>
          <button className={styles.tabActive}>👤 Profile</button>
          <button className={styles.tabDisabled} disabled>💼 Job Board</button>
        </div>
        <div className={styles.actions}>
          {isAuthenticated ? (
            <button className={styles.logout} onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          ) : (
            <button className={styles.signIn} onClick={() => navigate('/signin')}>Sign In</button>
          )}
        </div>
      </div>
    </nav>
  )
}
