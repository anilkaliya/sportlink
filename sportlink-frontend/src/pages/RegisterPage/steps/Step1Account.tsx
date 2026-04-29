import { useState } from 'react'
import { userApi } from '../../../api/user'
import f from '../../../components/AuthWizard/authForm.module.css'

export interface Step1Data {
  email: string
  phone: string
  password: string
  termsAccepted: boolean
  userId: string
}

interface Props {
  data: Step1Data
  onNext: (data: Step1Data) => void
}

function calcStrength(val: string): 0 | 1 | 2 | 3 | 4 {
  if (!val) return 0
  let score = 0
  if (val.length >= 8) score++
  if (/[A-Z]/.test(val)) score++
  if (/[0-9]/.test(val)) score++
  if (/[^A-Za-z0-9]/.test(val)) score++
  return score as 0 | 1 | 2 | 3 | 4
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = ['', 'var(--reg-accent2)', 'var(--reg-gold)', 'var(--reg-success)', 'var(--reg-success)']

export function Step1Account({ data, onNext }: Props) {
  const [form, setForm] = useState<Step1Data>(data)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = calcStrength(form.password)

  const barClass = (idx: number) => {
    if (idx >= strength) return f.pwBar
    return strength <= 1
      ? `${f.pwBar} ${f.pwBarWeak}`
      : strength <= 2
      ? `${f.pwBar} ${f.pwBarMedium}`
      : `${f.pwBar} ${f.pwBarStrong}`
  }

  async function handleContinue() {
    setError(null)
    setLoading(true)
    try {
      const res = await userApi.register({
        email: form.email,
        mobile_number: form.phone,
        password: form.password,
      })
      sessionStorage.setItem('sl_user_id', res.data.user_id)
      onNext({ ...form, userId: res.data.user_id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={f.formStep}>
      <div className={f.formHeader}>
        <div className={f.formStepTag}>Step 1 — Account</div>
        <div className={f.formTitle}>CREATE ACCOUNT</div>
        <div className={f.formSub}>Takes 60 seconds. No credit card needed.</div>
      </div>

      <div className={f.fieldGroup}>
        <label className={f.label}>Email address <span className={f.req}>*</span></label>
        <input
          className={f.input}
          type="email"
          placeholder="yourname@email.com"
          value={form.email}
          onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div className={f.fieldGroup}>
        <label className={f.label}>Mobile number <span className={f.req}>*</span></label>
        <div className={f.phoneWrap}>
          <div className={f.phoneCode}>+91</div>
          <input
            className={f.input}
            type="text"
            placeholder="98765 43210"
            maxLength={10}
            value={form.phone}
            onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div className={f.fieldHint}>Used for verification and job alerts</div>
      </div>

      <div className={f.fieldGroup}>
        <label className={f.label}>Password <span className={f.req}>*</span></label>
        <div className={f.pwWrap}>
          <input
            className={f.input}
            type={showPw ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
          />
          <button className={f.pwToggle} type="button" onClick={() => setShowPw(v => !v)}>
            {showPw ? '🙈' : '👁'}
          </button>
        </div>
        {form.password.length > 0 && (
          <div className={f.pwStrength}>
            <div className={f.pwBars}>
              {[0, 1, 2, 3].map(i => <div key={i} className={barClass(i)} />)}
            </div>
            <div className={f.pwLabel} style={{ color: STRENGTH_COLOR[strength] }}>
              {STRENGTH_LABEL[strength]}
            </div>
          </div>
        )}
      </div>

      <div className={f.fieldGroup}>
        <div className={f.termsRow}>
          <input
            className={f.termsCheckbox}
            type="checkbox"
            id="terms"
            checked={form.termsAccepted}
            onChange={e => setForm(prev => ({ ...prev, termsAccepted: e.target.checked }))}
          />
          <label htmlFor="terms" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, marginBottom: 0, fontSize: 13, color: 'var(--reg-muted)' }}>
            I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </label>
        </div>
      </div>

      {error && <div className={f.apiError}>{error}</div>}

      <button className={f.btnPrimary} onClick={handleContinue} disabled={loading}>
        {loading ? 'Creating account…' : <>Continue <span>→</span></>}
      </button>
    </div>
  )
}
