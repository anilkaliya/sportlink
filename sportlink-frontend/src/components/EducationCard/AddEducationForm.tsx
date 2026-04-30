import { useState } from 'react'
import { athleteApi } from '../../api/athlete'
import type { EducationEntry } from '../../types/athlete'
import styles from './EducationCard.module.css'

interface Props {
  athleteId: string
  initial?: EducationEntry
  onSuccess: (edu: EducationEntry) => void
  onCancel: () => void
}

export function AddEducationForm({ athleteId, initial, onSuccess, onCancel }: Props) {
  const [institution, setInstitution] = useState(initial?.institution_name ?? '')
  const [degree, setDegree] = useState(initial?.degree ?? '')
  const [field, setField] = useState(initial?.field_of_study ?? '')
  const [startYear, setStartYear] = useState(initial?.start_year?.toString() ?? '')
  const [endYear, setEndYear] = useState(initial?.end_year?.toString() ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  const isEdit = !!initial
  const currentYear = new Date().getFullYear()

  function validate() {
    const e: Record<string, string> = {}
    if (!institution.trim()) e.institution = 'Required'
    const sy = Number(startYear)
    if (!startYear || sy < 1970 || sy > currentYear) e.startYear = 'Valid year required'
    if (endYear) {
      const ey = Number(endYear)
      if (ey < 1970 || ey > currentYear + 10) e.endYear = 'Invalid year'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true); setApiError('')
    try {
      const end = endYear ? Number(endYear) : null
      const payload = {
        institution_name: institution.trim(),
        degree: degree.trim() || undefined,
        field_of_study: field.trim() || undefined,
        start_year: Number(startYear),
        end_year: end,
        is_current: end == null ? 1 : 0 as 0 | 1,
      }
      const res = isEdit
        ? await athleteApi.updateEducation(athleteId, initial.education_id, payload)
        : await athleteApi.addEducation(athleteId, payload)
      onSuccess(res.data)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.formInner}>
      <div className={styles.field}>
        <input className={styles.input} placeholder="Institution name e.g. JSS College, Mysuru" value={institution} onChange={e => setInstitution(e.target.value)} />
        {errors.institution && <span className={styles.err}>{errors.institution}</span>}
      </div>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <input className={styles.input} placeholder="Degree e.g. B.Sc, M.P.Ed" value={degree} onChange={e => setDegree(e.target.value)} />
        </div>
        <div className={styles.field}>
          <input className={styles.input} placeholder="Field of Study" value={field} onChange={e => setField(e.target.value)} />
        </div>
      </div>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <input className={styles.input} type="number" placeholder="Start year" value={startYear} onChange={e => setStartYear(e.target.value)} />
          {errors.startYear && <span className={styles.err}>{errors.startYear}</span>}
        </div>
        <div className={styles.field}>
          <input className={styles.input} type="number" placeholder="End year (blank if ongoing)" value={endYear} onChange={e => setEndYear(e.target.value)} />
          {errors.endYear && <span className={styles.err}>{errors.endYear}</span>}
        </div>
      </div>
      {apiError && <p className={styles.apiErr}>{apiError}</p>}
      <div className={styles.formActions}>
        <button className={styles.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Save'}</button>
        <button className={styles.btnCancel} onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  )
}
