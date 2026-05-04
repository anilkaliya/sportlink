import { useNavigate } from 'react-router-dom'
import { Card } from '../../ui/Card'
import type { PendingAction } from '../../../api/athlete'
import styles from './PendingActions.module.css'

interface Props {
  actions: PendingAction[]
  profileStats: string
  isLoading: boolean
}

const typeIcons: Record<string, string> = {
  profile: '✅',
  requests: '👥',
  achievement: '🏅',
}

export function PendingActions({ actions, profileStats, isLoading }: Props) {
  const navigate = useNavigate()

  function handleClick(type: string) {
    if (type === 'requests') navigate('/connections/requests')
    else if (type === 'profile') navigate('/profile')
  }

  return (
    <Card>
      <div className={styles.header}>
        <span className={styles.headerIcon}>📋</span>
        <h2 className={styles.title}>PENDING ACTIONS</h2>
        {profileStats && (
          <span className={styles.actionPercent} style={{ marginLeft: 'auto' }}>{profileStats}</span>
        )}
      </div>
      <div className={styles.list}>
        {isLoading && (
          <span style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>Loading…</span>
        )}
        {!isLoading && actions.length === 0 && (
          <span style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>All caught up!</span>
        )}
        {actions.map(a => (
          <div
            key={a.type}
            className={styles.actionItem}
            onClick={() => handleClick(a.type)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.actionIcon}>{typeIcons[a.type] ?? '📌'}</div>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>
                {a.type === 'requests' ? a.details : `Complete your profile`}
              </span>
              <span className={styles.actionSub}>{a.details}</span>
            </div>
            {a.type === 'profile' && a.profile_stats && (
              <span className={styles.actionPercent}>{a.profile_stats}</span>
            )}
            {a.type === 'requests' && <span className={styles.actionArrow}>›</span>}
          </div>
        ))}
      </div>
      <button className={styles.viewAllBtn}>View All Actions</button>
    </Card>
  )
}
