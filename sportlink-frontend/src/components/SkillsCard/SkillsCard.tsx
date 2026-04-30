import { useState } from 'react'
import type { Skill } from '../../types/athlete'
import { useAthleteStore } from '../../stores/athleteStore'
import { Card } from '../ui/Card'
import { SkillTag } from '../ui/SkillTag'
import { AddSkillForm } from './AddSkillForm'
import styles from './SkillsCard.module.css'

interface Props {
  skills: Skill[]
}

export function SkillsCard({ skills }: Props) {
  const [open, setOpen] = useState(false)
  const profile = useAthleteStore(s => s.profile)
  const addSkills = useAthleteStore(s => s.addSkills)

  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.title}>⚡ Skills</h2>
        <button className={styles.addBtn} onClick={() => setOpen(v => !v)}>+ Add</button>
      </div>
      <div className={`${styles.inlineForm} ${open ? styles.open : ''}`}>
        <AddSkillForm
          athleteId={profile?.athlete_id ?? ''}
          onSuccess={skills => { addSkills(skills); setOpen(false) }}
          onCancel={() => setOpen(false)}
        />
      </div>
      {skills.length === 0
        ? <p className={styles.empty}>No skills listed yet.</p>
        : <div className={styles.tags}>
            {skills.map(s => <SkillTag key={s.skill_id} skill={s} />)}
          </div>
      }
    </Card>
  )
}
