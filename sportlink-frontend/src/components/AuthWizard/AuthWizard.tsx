import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './AuthWizard.module.css'

interface Props {
  navRight: ReactNode
  leftPanel: ReactNode
  children: ReactNode
}

export function AuthWizard({ navRight, leftPanel, children }: Props) {
  return (
    <div className={styles.authRoot}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoAccent}>SPORT</span>LINK
        </Link>
        <div className={styles.navRight}>{navRight}</div>
      </nav>
      <div className={styles.wizardShell}>
        <div className={styles.wizardLeft}>{leftPanel}</div>
        <div className={styles.wizardRight}>{children}</div>
      </div>
    </div>
  )
}
