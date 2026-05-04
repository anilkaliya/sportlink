import { Card } from '../../ui/Card'
import styles from './PerformanceSnapshot.module.css'

interface StatItem {
  icon: string
  iconClass: string
  value: string
  label: string
  sub: string
}

interface Props {
  yearsActive: number
  activeSince: number
  goldMedals: number
  timePb: string | null
  timePbEvent: string
  distancePb: string | null
  distancePbEvent: string
  nationalTitles: number
}

export function PerformanceSnapshot({
  yearsActive,
  activeSince,
  goldMedals,
  timePb,
  timePbEvent,
  distancePb,
  distancePbEvent,
  nationalTitles,
}: Props) {
  const stats: StatItem[] = [
    {
      icon: '📅',
      iconClass: styles.iconGreen,
      value: String(yearsActive),
      label: 'Years Active',
      sub: `Since ${activeSince}`,
    },
    {
      icon: '🏆',
      iconClass: styles.iconGold,
      value: String(goldMedals),
      label: 'Gold Medals',
      sub: 'Total',
    },
    {
      icon: '⏱',
      iconClass: styles.iconBlue,
      value: timePb ?? '--',
      label: timePbEvent,
      sub: 'Personal Best',
    },
    {
      icon: '📏',
      iconClass: styles.iconPurple,
      value: distancePb ?? '--',
      label: distancePbEvent,
      sub: distancePbEvent,
    },
    {
      icon: '🥇',
      iconClass: styles.iconRed,
      value: String(nationalTitles),
      label: 'National Titles',
      sub: 'Won',
    },
  ]

  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>📊</span>
          YOUR PERFORMANCE SNAPSHOT
        </h2>
        <button className={styles.viewBtn}>View Full Stats</button>
      </div>
      <div className={styles.stats}>
        {stats.map(s => (
          <div key={s.label} className={styles.statItem}>
            <div className={`${styles.statIcon} ${s.iconClass}`}>{s.icon}</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statSub}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
