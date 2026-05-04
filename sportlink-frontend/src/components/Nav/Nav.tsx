import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useIncomingRequests } from '../../hooks/useIncomingRequests'
import { userApi } from '../../api/user'
import styles from './Nav.module.css'
import { useAthleteStore } from '../../stores/athleteStore'

export function Nav() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const [loggingOut, setLoggingOut] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const athlete_id = useAthleteStore(s => s.athlete_id)

  const { requests: incomingRequests } = useIncomingRequests()
  const pendingCount = incomingRequests.length

  const isDashboardActive = location.pathname === '/dashboard'
  const isProfileActive = location.pathname.startsWith('/profile')
  const isAthletesActive = location.pathname === '/athletes'
  const isRequestsActive = location.pathname === '/connections/requests'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await userApi.logout()
    } catch {
      // proceed regardless — clear local state and redirect
    }
    clearAuth()
    setUserMenuOpen(false)
    navigate('/signin')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.logo} onClick={() => navigate('/dashboard')}>
          <span className={styles.logoAccent}>SPORT</span>
          <span className={styles.logoText}>LINK</span>
        </div>
        <div className={styles.tabs}>
          <button
            className={isDashboardActive ? styles.tabActive : styles.tabInactive}
            onClick={() => navigate('/dashboard')}
          >
            🏠 Dashboard
          </button>
          <button
            className={isProfileActive ? styles.tabActive : styles.tabInactive}
            onClick={() => navigate(`/profile/${athlete_id}`)}
          >
            👤 Profile
          </button>
          <button
            className={isAthletesActive ? styles.tabActive : styles.tabInactive}
            onClick={() => navigate('/athletes')}
          >
            🏃 Athletes
          </button>
          <button
            className={isRequestsActive ? styles.tabActive : styles.tabInactive}
            onClick={() => navigate('/connections/requests')}
          >
            🔔 Requests
            {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
          </button>
        </div>
        <div className={styles.actions}>
          {isAuthenticated ? (
            <div className={styles.userMenu} ref={menuRef}>
              <button
                className={styles.userBtn}
                onClick={() => setUserMenuOpen(v => !v)}
              >
                <span className={styles.userAvatar}>👤</span>
                <span className={styles.userName}>User</span>
                <span className={styles.userChevron}>▾</span>
              </button>
              {userMenuOpen && (
                <div className={styles.dropdown}>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => { navigate(`/profile/${athlete_id}`); setUserMenuOpen(false) }}
                  >
                    My Profile
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className={styles.signIn} onClick={() => navigate('/signin')}>Sign In</button>
          )}
        </div>
      </div>
    </nav>
  )
}
