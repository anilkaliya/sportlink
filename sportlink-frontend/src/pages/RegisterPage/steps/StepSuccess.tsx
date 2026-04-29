import { useNavigate } from 'react-router-dom'
import styles from './StepSuccess.module.css'

interface Props {
  firstName: string
  lastName: string
  sport: string
  state: string
  athleteId: string
}

export function StepSuccess({ firstName, lastName, sport, state, athleteId }: Props) {
  const navigate = useNavigate()
  const name = `${firstName} ${lastName}`.trim() || 'Athlete'
  const sportLine = [sport, state].filter(Boolean).join(' · ')

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.icon}>🏃</div>
        <div className={styles.title}>YOU'RE IN.</div>
        <p className={styles.sub}>
          Your SportLink profile is live. Recruiters can now find you based on your passport level and sport.
        </p>
        <div className={styles.preview}>
          <div className={styles.previewAvatar}>🏃</div>
          <div>
            <div className={styles.previewName}>{name}</div>
            <div className={styles.previewSport}>{sportLine}</div>
          </div>
          <div className={styles.previewBadge}>ACTIVE</div>
        </div>
        <button className={styles.btn} onClick={() => navigate(`/profile/${athleteId}`)}>
          View My Profile →
        </button>
      </div>
    </div>
  )
}
