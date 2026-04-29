import type { PassportEntry as PassportEntryType } from '../../types/athlete'
import { resolveLevel, resolveTournamentName } from '../../types/athlete'
import { LevelBadge } from '../ui/LevelBadge'
import styles from './SportsPassport.module.css'

interface Props {
  entry: PassportEntryType
}

const levelIcon: Record<string, string> = {
  international: '🌏',
  national:      '🏅',
  state:         '🏃',
  district:      '📍',
}

const medalEmoji: Record<string, string> = {
  gold:   '🥇',
  silver: '🥈',
  bronze: '🥉',
  none:   '',
}

export function PassportEntry({ entry }: Props) {
  const level = resolveLevel(entry)
  const name  = resolveTournamentName(entry)
  const medal = entry.medal ? (medalEmoji[entry.medal] ?? '') : ''
  const pbTag = entry.is_personal_best === 1 ? ' · PB 🔥' : ''

  return (
    <div className={styles.entry}>
      <div className={styles.entryIcon}>
        {level ? (levelIcon[level] ?? '🏆') : '🏆'}
      </div>
      <div className={styles.entryContent}>
        <div className={styles.entryTitle}>{name}</div>
        <div className={styles.entrySub}>
          {entry.notes ?? ''}{medal ? ` ${medal}` : ''}{pbTag}
        </div>
        <div className={styles.entryMeta}>
          <span className={styles.entryDate}>{entry.year}</span>
          <LevelBadge level={level} />
        </div>
      </div>
    </div>
  )
}
