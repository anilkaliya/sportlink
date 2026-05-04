import { Card } from '../../ui/Card'
import styles from './Opportunities.module.css'

interface Opportunity {
  id: string
  title: string
  location: string
  date: string
  tag: string
  tagClass: string
  imageUrl: string | null
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: '1',
    title: 'State Athletics Trials 2025',
    location: 'Bengaluru, Karnataka',
    date: '20 May 2025',
    tag: 'Trials',
    tagClass: 'tagTrials',
    imageUrl: null,
  },
  {
    id: '2',
    title: 'Strength & Conditioning Workshop',
    location: 'Online',
    date: '10 Jun 2025',
    tag: 'Workshop',
    tagClass: 'tagWorkshop',
    imageUrl: null,
  },
]

const tagClassMap: Record<string, string> = {
  tagTrials: styles.tagTrials,
  tagWorkshop: styles.tagWorkshop,
  tagCamp: styles.tagCamp,
}

export function Opportunities() {
  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>🎯</span>
          OPPORTUNITIES FOR YOU
        </h2>
        <button className={styles.viewAll}>View All</button>
      </div>
      {MOCK_OPPORTUNITIES.length === 0 ? (
        <p className={styles.empty}>No opportunities right now.</p>
      ) : (
        <div className={styles.list}>
          {MOCK_OPPORTUNITIES.map(opp => (
            <div key={opp.id} className={styles.oppItem}>
              <div className={styles.oppImage}>
                {opp.imageUrl
                  ? <img src={opp.imageUrl} alt={opp.title} className={styles.oppImageImg} />
                  : '🏟'
                }
              </div>
              <div className={styles.oppContent}>
                <span className={styles.oppTitle}>{opp.title}</span>
                <span className={styles.oppLocation}>{opp.location}</span>
                <span className={`${styles.oppTag} ${tagClassMap[opp.tagClass] ?? ''}`}>
                  {opp.tag}
                </span>
              </div>
              <span className={styles.oppDate}>{opp.date}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
