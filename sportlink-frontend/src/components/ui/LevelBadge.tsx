import type { SportLevel } from '../../types/athlete'
import styles from './ui.module.css'

interface Props {
  level: SportLevel | null
}

export function LevelBadge({ level }: Props) {
  if (!level) return null

  const cls = {
    international: styles.levelIntl,
    national:      styles.levelNational,
    state:         styles.levelState,
    district:      styles.levelDistrict,
  }[level]

  return <span className={`${styles.levelBadge} ${cls}`}>{level}</span>
}
