import { useState } from 'react'
import type { PassportEntry as PassportEntryType } from '../../types/athlete'
import { useAthleteStore } from '../../stores/athleteStore'
import { Card } from '../ui/Card'
import { PassportEntry } from './PassportEntry'
import { AddPassportForm } from './AddPassportForm'
import styles from './SportsPassport.module.css'

interface Props {
  entries: PassportEntryType[]
  isOwner: boolean
}

export function SportsPassport({ entries, isOwner }: Props) {
  const [open, setOpen] = useState(false)
  const profile = useAthleteStore(s => s.profile)
  const addPassportEntry = useAthleteStore(s => s.addPassportEntry)
  const sorted = [...entries].sort((a, b) => b.year - a.year)

  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.title}>🛂 Sports Passport</h2>
        {isOwner && <button className={styles.addBtn} onClick={() => setOpen(v => !v)}>+ Add Entry</button>}
      </div>
      {isOwner && (
        <div className={`${styles.inlineForm} ${open ? styles.open : ''}`}>
          <AddPassportForm
            athleteId={profile?.athlete_id ?? ''}
            sportId={profile?.primary_sport_id ?? null}
            onSuccess={entry => { addPassportEntry(entry); setOpen(false) }}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
      {sorted.length === 0
        ? <p className={styles.empty}>No passport entries yet.</p>
        : <div className={styles.list}>
            {sorted.map(e => <PassportEntry key={e.passport_id} entry={e} />)}
          </div>
      }
    </Card>
  )
}
