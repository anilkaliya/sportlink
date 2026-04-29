import type { EducationEntry } from '../../types/athlete'
import { Card } from '../ui/Card'
import styles from './EducationCard.module.css'

interface Props {
  education: EducationEntry[]
}

function EduEntry({ entry }: { entry: EducationEntry }) {
  const years = `${entry.start_year ?? '?'}–${entry.end_year ?? 'Present'}`
  const degreeField = [entry.degree, entry.field_of_study].filter(Boolean).join(' · ')

  return (
    <div className={styles.entry}>
      <div className={styles.entryDegree}>{degreeField || 'Education'}</div>
      <div className={styles.entryInstitution}>{entry.institution_name}</div>
      <div className={styles.entryYears}>{years}</div>
    </div>
  )
}

export function EducationCard({ education }: Props) {
  return (
    <Card>
      <h2 className={styles.title}>🎓 Education</h2>
      {education.length === 0
        ? <p className={styles.empty}>No education entries yet.</p>
        : <div className={styles.list}>
            {education.map(e => <EduEntry key={e.education_id} entry={e} />)}
          </div>
      }
    </Card>
  )
}
