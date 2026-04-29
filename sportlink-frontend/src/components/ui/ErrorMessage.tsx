import styles from './ui.module.css'

interface Props {
  message: string
}

export function ErrorMessage({ message }: Props) {
  return (
    <div className={styles.errorWrap}>
      <div className={styles.errorCard}>
        <span className={styles.errorIcon}>⚠️</span>
        <p className={styles.errorMsg}>{message}</p>
        <button
          className={styles.errorRetry}
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
