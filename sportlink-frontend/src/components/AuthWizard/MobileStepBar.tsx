import { type WizardStep } from './WizardLeftPanel'
import styles from './MobileStepBar.module.css'

interface Props {
  step: WizardStep
}

function stepStatus(num: 1 | 2 | 3, current: WizardStep): 'done' | 'active' | 'pending' {
  if (current === 'success') return 'done'
  if (current === num) return 'active'
  return (current as number) > num ? 'done' : 'pending'
}

const LABELS = ['Account', 'Profile', 'Passport'] as const

export function MobileStepBar({ step }: Props) {
  const items: React.ReactNode[] = []

  LABELS.forEach((label, i) => {
    const num = (i + 1) as 1 | 2 | 3
    const status = stepStatus(num, step)
    const stepClass =
      status === 'done'   ? `${styles.step} ${styles.stepDone}`
      : status === 'active' ? `${styles.step} ${styles.stepActive}`
      : styles.step
    const dotClass =
      status === 'done'   ? `${styles.dot} ${styles.dotDone}`
      : status === 'active' ? `${styles.dot} ${styles.dotActive}`
      : styles.dot

    if (i > 0) {
      const prevStatus = stepStatus((i as 1 | 2 | 3), step)
      items.push(
        <div
          key={`line-${num}`}
          className={prevStatus === 'done' ? `${styles.line} ${styles.lineDone}` : styles.line}
        />
      )
    }

    items.push(
      <div key={label} className={stepClass}>
        <div className={dotClass}>{status === 'done' ? '✓' : num}</div>
        <span>{label}</span>
      </div>
    )
  })

  return (
    <div className={styles.bar}>
      <div className={styles.steps}>{items}</div>
    </div>
  )
}
