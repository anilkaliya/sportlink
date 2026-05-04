import type { AthleteFilters } from '../../types/athlete'
import type { Sport } from '../../api/sports'
import styles from './AthleteFilterBar.module.css'

interface Props {
  filters: AthleteFilters
  sports: Sport[]
  onFiltersChange: (filters: AthleteFilters) => void
}

export function AthleteFilterBar({ filters, sports, onFiltersChange }: Props) {
  function update(patch: Partial<AthleteFilters>) {
    onFiltersChange({ ...filters, ...patch, page: undefined })
  }

  return (
    <div className={styles.bar}>
      <input
        className={styles.search}
        type="text"
        placeholder="Search by name..."
        value={filters.search ?? ''}
        onChange={e => update({ search: e.target.value || undefined })}
      />
      <select
        className={styles.select}
        value={filters.sport ?? ''}
        onChange={e => update({ sport: e.target.value || undefined })}
      >
        <option value="">All Sports</option>
        {sports.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select
        className={styles.select}
        value={filters.level ?? ''}
        onChange={e => update({ level: e.target.value || undefined })}
      >
        <option value="">All Levels</option>
        <option value="international">International</option>
        <option value="national">National</option>
        <option value="state">State</option>
        <option value="district">District</option>
      </select>
      <input
        className={styles.search}
        type="text"
        placeholder="Filter by city..."
        value={filters.city ?? ''}
        onChange={e => update({ city: e.target.value || undefined })}
      />
    </div>
  )
}
