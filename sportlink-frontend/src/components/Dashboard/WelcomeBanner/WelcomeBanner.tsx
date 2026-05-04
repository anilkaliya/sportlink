import styles from './WelcomeBanner.module.css'

interface Props {
  name: string
  location: string
  sport: string
  profileStrength: number
  photoUrl: string | null
}

export function WelcomeBanner({ name, location, sport, profileStrength, photoUrl }: Props) {
  const firstName = name.split(' ')[0]

  return (
    <div className={styles.banner}>
      <div className={styles.bannerContent}>
        <div className={styles.avatar}>
          {photoUrl
            ? <img src={photoUrl} alt={name} className={styles.avatarImg} />
            : <span>🏃</span>
          }
        </div>
        <div className={styles.textBlock}>
          <h1 className={styles.greeting}>Welcome back, {firstName}!</h1>
          <p className={styles.subtitle}>Keep connecting, keep improving.</p>
          <div className={styles.tags}>
            <span className={styles.tag}>
              <span className={styles.tagIcon}>📍</span> {location}
            </span>
            <span className={styles.tag}>
              <span className={styles.tagIcon}>🏃</span> {sport}
            </span>
            <span className={styles.tag}>
              <span className={styles.tagIcon}>📊</span> Profile strength: <span className={styles.strengthValue}>{profileStrength}%</span>
            </span>
          </div>
        </div>
      </div>
      <div className={styles.illustration}>🏃</div>
    </div>
  )
}
