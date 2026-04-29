import styles from './ui.module.css'

export function LoadingSpinner() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonCover} />
      <div className={styles.skeletonHero}>
        <div className={styles.skeletonAvatar} />
        <div className={styles.skeletonLines}>
          <div className={`${styles.skeletonLine} ${styles.lineWide}`} />
          <div className={`${styles.skeletonLine} ${styles.lineMid}`} />
          <div className={`${styles.skeletonLine} ${styles.lineNarrow}`} />
        </div>
      </div>
      <div className={styles.skeletonStats}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={styles.skeletonStatCell} />
        ))}
      </div>
      <div className={styles.skeletonGrid}>
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCardSm} />
      </div>
    </div>
  )
}
