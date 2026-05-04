import { Card } from '../../ui/Card'
import styles from './RecentActivity.module.css'

interface ActivityItem {
  id: string
  icon: string
  text: string
  time: string
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', icon: '🏆', text: 'Rahul Sharma won Gold in 400m at State Championship', time: '2 days ago' },
  { id: '2', icon: '🏃', text: 'Neha Reddy achieved a new 100m PB - 11.48s', time: '3 days ago' },
  { id: '3', icon: '👤', text: 'Vikram Singh sent you a connection request', time: '5 days ago' },
]

export function RecentActivity() {
  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>⚡</span>
          RECENT ACTIVITY
        </h2>
        <button className={styles.viewAll}>View All</button>
      </div>
      <div className={styles.list}>
        {MOCK_ACTIVITY.map(item => (
          <div key={item.id} className={styles.activityItem}>
            <div className={styles.activityIcon}>{item.icon}</div>
            <div className={styles.activityContent}>
              <span className={styles.activityText}>{item.text}</span>
              <span className={styles.activityTime}>{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
