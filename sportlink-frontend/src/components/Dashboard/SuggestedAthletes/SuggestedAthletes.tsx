import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../ui/Card'
import type { Suggestion } from '../../../api/connections'
import styles from './SuggestedAthletes.module.css'

interface Props {
  athletes: Suggestion[]
  isLoading: boolean
}

const levelClass: Record<string, string> = {
  international: styles.levelInternational,
  national: styles.levelNational,
  state: styles.levelState,
  district: styles.levelDistrict,
}

export function SuggestedAthletes({ athletes, isLoading }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  function scrollRight() {
    listRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>👥</span>
          SUGGESTED ATHLETES
        </h2>
        <button className={styles.viewAll} onClick={() => navigate('/athletes')}>
          View All Athletes
        </button>
      </div>
      <div className={styles.scrollWrap}>
        <div className={styles.list} ref={listRef}>
          {isLoading && (
            <span style={{ color: 'var(--muted)', fontSize: 13, padding: 16 }}>Loading suggestions…</span>
          )}
          {!isLoading && athletes.length === 0 && (
            <span style={{ color: 'var(--muted)', fontSize: 13, padding: 16 }}>No suggestions yet</span>
          )}
          {athletes.map(a => (
            <div key={a.athlete_id} className={styles.athleteCard}>
              <div className={styles.avatarWrap}>
                <div className={styles.athleteAvatar}>
                  {a.profile_pic
                    ? <img src={a.profile_pic} alt={a.name} className={styles.athleteAvatarImg} />
                    : '🏃'
                  }
                </div>
              </div>
              <span className={styles.athleteName}>{a.name}</span>
              <span className={styles.athleteLocation}>📍 {a.location}</span>
              <span className={`${styles.levelBadge} ${levelClass[a.level.toLowerCase()] ?? ''}`}>
                {a.level} Level
              </span>
              <button
                className={styles.connectBtn}
                onClick={() => navigate(`/profile/${a.athlete_id}`)}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
        {athletes.length > 0 && (
          <button className={styles.scrollBtn} onClick={scrollRight} aria-label="Scroll right">
            ›
          </button>
        )}
      </div>
    </Card>
  )
}
