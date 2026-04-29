import type { Skill } from '../../types/athlete'
import { Card } from '../ui/Card'
import { SkillTag } from '../ui/SkillTag'
import styles from './SkillsCard.module.css'

interface Props {
  skills: Skill[]
}

export function SkillsCard({ skills }: Props) {
  return (
    <Card>
      <h2 className={styles.title}>⚡ Skills</h2>
      {skills.length === 0
        ? <p className={styles.empty}>No skills listed yet.</p>
        : <div className={styles.tags}>
            {skills.map(s => <SkillTag key={s.skill_id} skill={s} />)}
          </div>
      }
    </Card>
  )
}
