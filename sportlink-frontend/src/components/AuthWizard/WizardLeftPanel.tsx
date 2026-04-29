import styles from './WizardLeftPanel.module.css'

export type WizardStep = 1 | 2 | 3 | 'success'

interface StepMeta {
  label: string
  desc: string
}

const STEPS: StepMeta[] = [
  { label: 'Create Account',  desc: 'Email, phone & password' },
  { label: 'Athlete Profile', desc: 'Your identity & sport' },
  { label: 'Sports Passport', desc: 'Your first achievement' },
]

function stepStatus(num: 1 | 2 | 3, current: WizardStep): 'done' | 'active' | 'pending' {
  if (current === 'success') return 'done'
  if (current === num) return 'active'
  return (current as number) > num ? 'done' : 'pending'
}

interface Props {
  step: WizardStep
  tag: string
  headingLine1: string
  headingLine2: string
  body: string
}

export function WizardLeftPanel({ step, tag, headingLine1, headingLine2, body }: Props) {
  return (
    <>
      <div className={styles.leftContent}>
        <div className={styles.leftTag}>{tag}</div>
        <div className={styles.leftHeading}>
          {headingLine1}
          <em className={styles.leftHeadingAccent}>{headingLine2}</em>
        </div>
        <p className={styles.leftBody}>{body}</p>
      </div>

      <div className={styles.stepTrack}>
        {STEPS.map((s, i) => {
          const num = (i + 1) as 1 | 2 | 3
          const status = stepStatus(num, step)
          const dotClass =
            status === 'done'
              ? `${styles.stepDot} ${styles.stepDotDone}`
              : status === 'active'
              ? `${styles.stepDot} ${styles.stepDotActive}`
              : `${styles.stepDot} ${styles.stepDotPending}`
          const nameClass =
            status === 'done'
              ? `${styles.stepName} ${styles.stepNameDone}`
              : status === 'active'
              ? `${styles.stepName} ${styles.stepNameActive}`
              : `${styles.stepName} ${styles.stepNamePending}`
          return (
            <div key={num} className={styles.stepItem}>
              <div className={dotClass}>{status === 'done' ? '✓' : num}</div>
              <div className={styles.stepLabel}>
                <div className={nameClass}>{s.label}</div>
                <div className={styles.stepDesc}>{s.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
