import styles from './ui.module.css'

interface Props {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: Props) {
  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      {children}
    </div>
  )
}
