import type { PassportEntry as PassportEntryType } from '../../types/athlete'
import { Card } from '../ui/Card'
import { PassportEntry } from './PassportEntry'
import styles from './SportsPassport.module.css'

interface Props {
  entries: PassportEntryType[]
}

export function SportsPassport({ entries }: Props) {
  const sorted = [...entries].sort((a, b) => b.year - a.year)

  return (
    <Card>
      <h2 className={styles.title}>🛂 Sports Passport</h2>
      {sorted.length === 0
        ? <p className={styles.empty}>No passport entries yet.</p>
        : <div className={styles.list}>
            {sorted.map(e => <PassportEntry key={e.passport_id} entry={e} />)}
          </div>
      }
    </Card>
  )
}
