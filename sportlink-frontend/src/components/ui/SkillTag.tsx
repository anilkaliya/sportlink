import type { Skill } from '../../types/athlete'
import styles from './ui.module.css'

interface Props {
  skill: Skill
}

const categoryEmoji: Record<string, string> = {
  sport_specific: '🏃',
  soft_skill:     '🤝',
  technical:      '📊',
  leadership:     '🎯',
}

export function SkillTag({ skill }: Props) {
  const emoji = categoryEmoji[skill.category] ?? '⚡'
  return (
    <span className={styles.skillTag}>
      {emoji} {skill.skill_name}
      {skill.endorsement_count > 0 && (
        <span className={styles.endorseCount}> +{skill.endorsement_count}</span>
      )}
    </span>
  )
}
