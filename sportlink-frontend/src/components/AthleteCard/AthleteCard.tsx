import { useNavigate } from 'react-router-dom'
import type { AthleteListItem } from '../../types/athlete'
import { ConnectionButton } from '../ConnectionButton/ConnectionButton'
import styles from './AthleteCard.module.css'

interface Props {
  athlete: AthleteListItem
  currentUserId: string
  sportName?: string
}

export function AthleteCard({ athlete, currentUserId, sportName }: Props) {
  const navigate = useNavigate()

  function goToProfile() {
    navigate(`/profile/${athlete.athlete_id}`)
  }

  const location = [athlete.city, athlete.state].filter(Boolean).join(', ')

  return (
    <div className={styles.card}>
      <div className={styles.top} onClick={goToProfile}>
        <div className={styles.avatar}>
          {athlete.profile_photo_url
            ? <img src={athlete.profile_photo_url} alt={athlete.full_name} className={styles.avatarImg} />
            : <span className={styles.avatarEmoji}>🏃</span>
          }
        </div>
        <h3 className={styles.name}>{athlete.full_name}</h3>
        {sportName && <p className={styles.sport}>{sportName}</p>}
        {location && <p className={styles.location}>{location}</p>}
      </div>
      <div className={styles.actions}>
        <ConnectionButton targetUserId={athlete.user_id} currentUserId={currentUserId} />
      </div>
    </div>
  )
}
