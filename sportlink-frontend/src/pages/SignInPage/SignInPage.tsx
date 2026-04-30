import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userApi } from '../../api/user'
import { useAuthStore } from '../../stores/authStore'
import { AuthWizard } from '../../components/AuthWizard/AuthWizard'
import f from '../../components/AuthWizard/authForm.module.css'
import styles from './SignInPage.module.css'

function LeftPanel() {
  return (
    <>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className={f.formStepTag} style={{ color: 'var(--reg-accent-dk)', background: 'rgba(232,255,60,0.1)', border: '1px solid rgba(232,255,60,0.25)', display: 'inline-block', padding: '4px 12px', borderRadius: 20, marginBottom: 28 }}>
          Welcome back
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 4vw, 56px)', lineHeight: 1, letterSpacing: 2, color: '#fff', marginBottom: 20 }}>
          GOOD TO<em style={{ fontStyle: 'normal', color: 'var(--reg-accent)', display: 'block' }}>SEE YOU.</em>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', maxWidth: 320 }}>
          Your passport, your achievements, your next opportunity — all waiting for you.
        </p>
      </div>
      <div className={styles.statsBlock}>
        <div className={styles.stat}>
          <div className={styles.statVal}>12,400+</div>
          <div className={styles.statLabel}>Athletes on SportLink</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <div className={styles.statVal}>340+</div>
          <div className={styles.statLabel}>Jobs with sports quota</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <div className={styles.statVal}>28</div>
          <div className={styles.statLabel}>Sports covered</div>
        </div>
      </div>
    </>
  )
}

export function SignInPage() {
  const navigate = useNavigate()
  const setAuthenticated = useAuthStore(s => s.setAuthenticated)
  const setAccessToken = useAuthStore(s => s.setAccessToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setError(null)
    setLoading(true)
    try {
      const res = await userApi.login({ email, password })
      const { onboarding_step, user_id, athlete_id } = res.data

      setAuthenticated(true)
      setAccessToken(res.accessToken)
      if (athlete_id) {
        navigate('/profile/' + athlete_id)
      } else if (onboarding_step === 0) {
        sessionStorage.setItem('sl_user_id', user_id)
        navigate('/register', { state: { step: 2 } })
      } else {
        navigate('/register', { state: { step: 3 } })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthWizard
      navRight={<span>New here? <Link to="/register">Create account</Link></span>}
      leftPanel={<LeftPanel />}
    >
      <div className={styles.formWrap}>
        <div className={f.formHeader} style={{ marginBottom: 32 }}>
          <div className={f.formStepTag}>Sign In</div>
          <div className={f.formTitle}>WELCOME BACK</div>
          <div className={f.formSub}>Enter your credentials to access your profile.</div>
        </div>

        <div className={f.fieldGroup}>
          <label className={f.label}>Email address <span className={f.req}>*</span></label>
          <input className={f.input} type="email" placeholder="email@example.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className={f.fieldGroup}>
          <label className={f.label}>Password <span className={f.req}>*</span></label>
          <div className={f.pwWrap}>
            <input className={f.input} type={showPw ? 'text' : 'password'} placeholder="Your password"
              value={password} onChange={e => setPassword(e.target.value)} />
            <button className={f.pwToggle} type="button" onClick={() => setShowPw(v => !v)}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <div className={styles.metaRow}>
          <label className={styles.rememberRow}>
            <input className={styles.rememberCheckbox} type="checkbox" checked={remember}
              onChange={e => setRemember(e.target.checked)} />
            <span>Keep me signed in</span>
          </label>
          <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
        </div>

        {error && <div className={f.apiError} style={{ marginTop: 16 }}>{error}</div>}

        <button className={f.btnPrimary} style={{ marginTop: 24 }} onClick={handleSignIn} disabled={loading}>
          {loading ? 'Signing in…' : <>Sign In <span>→</span></>}
        </button>

        <div className={styles.orDivider}><span>or</span></div>

        <button className={styles.btnOtp} disabled={loading}>
          📱 Sign in with OTP
        </button>

        <p className={styles.joinNote}>
          Don't have an account? <Link to="/register">Join SportLink free</Link>
        </p>
      </div>
    </AuthWizard>
  )
}
