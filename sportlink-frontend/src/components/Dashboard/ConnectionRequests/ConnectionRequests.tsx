import { useNavigate } from 'react-router-dom'
import { Card } from '../../ui/Card'
import styles from './ConnectionRequests.module.css'

interface RequestItem {
  id: string
  name: string
  detail: string
  photoUrl: string | null
}

const MOCK_REQUESTS: RequestItem[] = [
  { id: '1', name: 'Vikram Singh', detail: 'Athletics \u2022 Bengaluru', photoUrl: null },
  { id: '2', name: 'Ananya Iyer', detail: 'Athletics \u2022 Mysuru', photoUrl: null },
]

export function ConnectionRequests() {
  const navigate = useNavigate()

  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>🤝</span>
          CONNECTION REQUESTS
        </h2>
        <button className={styles.viewAll} onClick={() => navigate('/connections/requests')}>View All</button>
      </div>
      <div className={styles.list}>
        {MOCK_REQUESTS.length === 0 ? (
          <p className={styles.empty}>No pending requests.</p>
        ) : (
          MOCK_REQUESTS.map(r => (
            <div key={r.id} className={styles.requestItem}>
              <div className={styles.avatar}>
                {r.photoUrl
                  ? <img src={r.photoUrl} alt={r.name} className={styles.avatarImg} />
                  : '👤'
                }
              </div>
              <div className={styles.info}>
                <span className={styles.name}>{r.name}</span>
                <span className={styles.detail}>{r.detail}</span>
              </div>
              <div className={styles.actions}>
                <button className={styles.acceptBtn}>Accept</button>
                <button className={styles.ignoreBtn}>Ignore</button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
