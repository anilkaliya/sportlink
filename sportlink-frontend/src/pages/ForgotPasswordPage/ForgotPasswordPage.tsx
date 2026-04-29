import { useState } from 'react'
import { Link } from 'react-router-dom'
import f from '../../components/AuthWizard/authForm.module.css'
import styles from './ForgotPasswordPage.module.css'

type ResetMethod = 'email' | 'sms'

export function ForgotPasswordPage() {
  const [contact, setContact] = useState('')
  const [method, setMethod] = useState<ResetMethod>('email')
  const [sent, setSent] = useState(false)

  function handleSend() {
    if (!contact.trim()) return
    setSent(true)
  }

  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoAccent}>SPORT</span>LINK
        </Link>
        <Link to="/signin" className={styles.navBack}>← Back to sign in</Link>
      </nav>

      <div className={styles.shell}>
        <div className={styles.card}>
          <div className={styles.icon}>🔑</div>

          <div className={f.formTitle} style={{ textAlign: 'center', marginBottom: 8 }}>RESET PASSWORD</div>
          <p className={f.formSub} style={{ textAlign: 'center', marginBottom: 32 }}>
            Enter your registered email or mobile. We'll send a reset link or OTP.
          </p>

          <div className={f.fieldGroup}>
            <label className={f.label}>Email or mobile number <span className={f.req}>*</span></label>
            <input className={f.input} type="text" placeholder="email@example.com or 98765 43210"
              value={contact} onChange={e => setContact(e.target.value)} />
            <div className={f.fieldHint}>We'll send a reset link to your email or an OTP to your mobile</div>
          </div>

          <div className={f.fieldGroup}>
            <label className={f.label}>Send via</label>
            <div className={styles.methodGrid}>
              <div
                className={method === 'email' ? `${styles.method} ${styles.methodSelected}` : styles.method}
                onClick={() => setMethod('email')}
              >
                <span className={styles.methodIcon}>📧</span>
                <span className={styles.methodLabel}>Email link</span>
              </div>
              <div
                className={method === 'sms' ? `${styles.method} ${styles.methodSelected}` : styles.method}
                onClick={() => setMethod('sms')}
              >
                <span className={styles.methodIcon}>📱</span>
                <span className={styles.methodLabel}>SMS OTP</span>
              </div>
            </div>
          </div>

          <button
            className={f.btnPrimary}
            style={{ marginTop: 8, background: sent ? 'var(--reg-success)' : undefined }}
            onClick={handleSend}
            disabled={sent}
          >
            {sent ? '✓ Link Sent' : <>Send Reset Link <span>→</span></>}
          </button>

          {sent && (
            <div className={styles.confirm}>
              <div className={styles.confirmIcon}>✓</div>
              <div className={styles.confirmText}>
                Check your inbox. The link expires in <strong>15 minutes</strong>.{' '}
                Didn't receive it?{' '}
                <a onClick={() => { setSent(false); setTimeout(() => setSent(true), 100) }}>Resend</a>
              </div>
            </div>
          )}

          <p className={styles.backNote}>
            Remembered it? <Link to="/signin">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
