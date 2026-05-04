import { useState } from 'react'
import type { EducationEntry } from '../../types/athlete'
import { useAthleteStore } from '../../stores/athleteStore'
import { Card } from '../ui/Card'
import { AddEducationForm } from './AddEducationForm'
import styles from './EducationCard.module.css'

interface Props {
  education: EducationEntry[]
  isOwner: boolean
}

interface EduEntryProps {
  entry: EducationEntry
  isEditing: boolean
  isOwner: boolean
  athleteId: string
  onEdit: () => void
  onEditClose: () => void
  onUpdated: (edu: EducationEntry) => void
}

function EduEntry({ entry, isEditing, isOwner, athleteId, onEdit, onEditClose, onUpdated }: EduEntryProps) {
  const years = `${entry.start_year ?? '?'}–${entry.end_year ?? 'Present'}`
  const degreeField = [entry.degree, entry.field_of_study].filter(Boolean).join(' · ')

  return (
    <div className={styles.entry}>
      <div className={styles.entryHeader}>
        <div className={styles.entryInfo}>
          <div className={styles.entryDegree}>{degreeField || 'Education'}</div>
          <div className={styles.entryInstitution}>{entry.institution_name}</div>
          <div className={styles.entryYears}>{years}</div>
        </div>
        {isOwner && (
          <button className={styles.editBtn} onClick={isEditing ? onEditClose : onEdit}>
            {isEditing ? '✕' : '✏️'}
          </button>
        )}
      </div>
      {isOwner && (
        <div className={`${styles.inlineForm} ${isEditing ? styles.open : ''}`}>
          <AddEducationForm
            athleteId={athleteId}
            initial={entry}
            onSuccess={edu => { onUpdated(edu); onEditClose() }}
            onCancel={onEditClose}
          />
        </div>
      )}
    </div>
  )
}

export function EducationCard({ education, isOwner }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const profile = useAthleteStore(s => s.profile)
  const addEducation = useAthleteStore(s => s.addEducation)
  const updateEducation = useAthleteStore(s => s.updateEducation)

  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.title}>🎓 Education</h2>
        {isOwner && <button className={styles.addBtn} onClick={() => { setAddOpen(v => !v); setEditingId(null) }}>+ Add</button>}
      </div>
      {isOwner && (
        <div className={`${styles.inlineForm} ${addOpen ? styles.open : ''}`}>
          <AddEducationForm
            athleteId={profile?.athlete_id ?? ''}
            onSuccess={edu => { addEducation(edu); setAddOpen(false) }}
            onCancel={() => setAddOpen(false)}
          />
        </div>
      )}
      {education.length === 0
        ? <p className={styles.empty}>No education entries yet.</p>
        : <div className={styles.list}>
            {education.map(e => (
              <EduEntry
                key={e.education_id}
                entry={e}
                isEditing={editingId === e.education_id}
                isOwner={isOwner}
                athleteId={profile?.athlete_id ?? ''}
                onEdit={() => { setEditingId(e.education_id); setAddOpen(false) }}
                onEditClose={() => setEditingId(null)}
                onUpdated={updateEducation}
              />
            ))}
          </div>
      }
    </Card>
  )
}
