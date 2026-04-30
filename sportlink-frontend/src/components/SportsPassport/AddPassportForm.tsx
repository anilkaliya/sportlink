import { useState, useEffect } from 'react'
import { athleteApi } from '../../api/athlete'
import { sportsApi, type Tournament } from '../../api/sports'
import type { SportLevel, Medal, PassportEntry } from '../../types/athlete'
import styles from './SportsPassport.module.css'

const LEVELS: [SportLevel, string][] = [
  ['international', '🌍 International'], ['national', '🏅 National'],
  ['state', '🏃 State'], ['district', '📍 District'],
]
const MEDALS: [Medal, string][] = [
  ['gold', '🥇 Gold'], ['silver', '🥈 Silver'], ['bronze', '🥉 Bronze'], ['none', '🏅 Participated'],
]

interface Props {
  athleteId: string
  sportId: string | null
  onSuccess: (entry: PassportEntry) => void
  onCancel: () => void
}

export function AddPassportForm({ athleteId, sportId, onSuccess, onCancel }: Props) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [tournamentId, setTournamentId] = useState('')
  const [customName, setCustomName] = useState('')
  const [event, setEvent] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [venue, setVenue] = useState('')
  const [level, setLevel] = useState<SportLevel | ''>('')
  const [medal, setMedal] = useState<Medal | ''>('')
  const [result, setResult] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => { sportsApi.getTournaments().then(setTournaments).catch(() => {}) }, [])

  const isOther = tournamentId === 'other'

  function validate() {
    const e: Record<string, string> = {}
    if (!tournamentId) e.tournament = 'Required'
    if (isOther && !customName.trim()) e.customName = 'Tournament name required'
    if (!event.trim()) e.event = 'Required'
    if (!year || year < 1970 || year > new Date().getFullYear()) e.year = 'Valid year required'
    if (!level) e.level = 'Select a level'
    if (!medal) e.medal = 'Select a result'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate() || !sportId) { if (!sportId) setApiError('No sport on profile'); return }
    setSaving(true); setApiError('')
    try {
      const notes = [event, venue, result].filter(Boolean).join(' · ')
      const payload: Record<string, unknown> = {
        sport_id: sportId, year, medal, level_override: level,
        notes: notes || undefined,
        ...(isOther ? { tournament_name_override: customName } : { tournament_id: tournamentId }),
      }
      const res = await athleteApi.addPassportEntry(athleteId, payload as never)
      onSuccess(res.data)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.formInner}>
      <div className={styles.field}>
        <select className={styles.input} value={tournamentId} onChange={e => setTournamentId(e.target.value)}>
          <option value="">Select tournament…</option>
          {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          <option value="other">Other / Custom</option>
        </select>
        {errors.tournament && <span className={styles.err}>{errors.tournament}</span>}
      </div>
      {isOther && (
        <div className={styles.field}>
          <input className={styles.input} placeholder="Tournament name" value={customName} onChange={e => setCustomName(e.target.value)} />
          {errors.customName && <span className={styles.err}>{errors.customName}</span>}
        </div>
      )}
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <input className={styles.input} placeholder="Event / Discipline e.g. 100m Sprint" value={event} onChange={e => setEvent(e.target.value)} />
          {errors.event && <span className={styles.err}>{errors.event}</span>}
        </div>
        <div className={styles.field}>
          <input className={styles.input} type="number" placeholder="Year" value={year} onChange={e => setYear(Number(e.target.value))} />
          {errors.year && <span className={styles.err}>{errors.year}</span>}
        </div>
      </div>
      <div className={styles.field}>
        <input className={styles.input} placeholder="Venue (optional)" value={venue} onChange={e => setVenue(e.target.value)} />
      </div>
      <div className={styles.field}>
        <div className={styles.optionRow}>
          {LEVELS.map(([v, l]) => (
            <button key={v} type="button" className={`${styles.optionBtn} ${level === v ? styles.optionSelected : ''}`} onClick={() => setLevel(v)}>{l}</button>
          ))}
        </div>
        {errors.level && <span className={styles.err}>{errors.level}</span>}
      </div>
      <div className={styles.field}>
        <div className={styles.optionRow}>
          {MEDALS.map(([v, l]) => (
            <button key={v} type="button" className={`${styles.optionBtn} ${medal === v ? styles.optionSelected : ''}`} onClick={() => setMedal(v)}>{l}</button>
          ))}
        </div>
        {errors.medal && <span className={styles.err}>{errors.medal}</span>}
      </div>
      <div className={styles.field}>
        <input className={styles.input} placeholder="Result / Performance (optional) e.g. 11.34s" value={result} onChange={e => setResult(e.target.value)} />
      </div>
      {apiError && <p className={styles.apiErr}>{apiError}</p>}
      <div className={styles.formActions}>
        <button className={styles.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Entry'}</button>
        <button className={styles.btnCancel} onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  )
}
