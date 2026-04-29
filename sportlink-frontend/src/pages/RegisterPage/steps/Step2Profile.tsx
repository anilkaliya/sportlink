import { useState } from 'react'
import type { Sport } from '../../../api/sports'
import { athleteApi } from '../../../api/athlete'
import f from '../../../components/AuthWizard/authForm.module.css'

export interface Step2Data {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other' | ''
  city: string
  state: string
  primarySport: string
  isStillCompeting: boolean
  languages: string[]
  athleteId: string
}

interface Props {
  data: Step2Data
  sports: Sport[]
  userId: string
  onNext: (data: Step2Data) => void
  onBack: () => void
}

const LANGUAGES = ['Hindi', 'English', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Punjabi', 'Gujarati', 'Malayalam']

const STATES = [
  'Andhra Pradesh','Assam','Bihar','Delhi','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Odisha','Punjab','Rajasthan','Tamil Nadu',
  'Telangana','Uttar Pradesh','Uttarakhand','West Bengal',
]

export function Step2Profile({ data, sports, userId, onNext, onBack }: Props) {
  const [form, setForm] = useState<Step2Data>(data)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleLang(lang: string) {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }))
  }

  async function handleContinue() {
    setError(null)
    setLoading(true)
    try {
      const res = await athleteApi.create({
        user_id: userId,
        first_name: form.firstName,
        last_name: form.lastName,
        date_of_birth: form.dateOfBirth,
        gender: form.gender,
        city: form.city,
        state: form.state,
        country: 'India',
        primary_sport_id: form.primarySport,
        languages: form.languages.join(','),
      })
      sessionStorage.setItem('sl_athlete_id', res.data.athlete_id)
      sessionStorage.setItem('sl_sport_id', form.primarySport)
      onNext({ ...form, athleteId: res.data.athlete_id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={f.formStep}>
      <div className={f.formHeader}>
        <div className={f.formStepTag}>Step 2 — Athlete Profile</div>
        <div className={f.formTitle}>WHO ARE YOU?</div>
        <div className={f.formSub}>Your public profile. Visible to recruiters and scouts.</div>
      </div>

      <div className={f.sectionDivider}>Personal</div>

      <div className={f.fieldGroupHalf}>
        <div>
          <label className={f.label}>First name <span className={f.req}>*</span></label>
          <input className={f.input} type="text" placeholder="Priya" value={form.firstName}
            onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
        </div>
        <div>
          <label className={f.label}>Last name <span className={f.req}>*</span></label>
          <input className={f.input} type="text" placeholder="Sharma" value={form.lastName}
            onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
        </div>
      </div>

      <div className={f.fieldGroupHalf}>
        <div>
          <label className={f.label}>Date of birth <span className={f.req}>*</span></label>
          <input className={f.input} type="text" placeholder="DD / MM / YYYY" value={form.dateOfBirth}
            onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
        </div>
        <div>
          <label className={f.label}>Gender <span className={f.req}>*</span></label>
          <select className={f.select} value={form.gender}
            onChange={e => setForm(p => ({ ...p, gender: e.target.value as Step2Data['gender'] }))}>
            <option value="" disabled>Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className={f.sectionDivider}>Location</div>

      <div className={f.fieldGroupHalf}>
        <div>
          <label className={f.label}>City <span className={f.req}>*</span></label>
          <input className={f.input} type="text" placeholder="Bengaluru" value={form.city}
            onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
        </div>
        <div>
          <label className={f.label}>State <span className={f.req}>*</span></label>
          <select className={f.select} value={form.state}
            onChange={e => setForm(p => ({ ...p, state: e.target.value }))}>
            <option value="" disabled>Select state</option>
            {STATES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className={f.sectionDivider}>Sport</div>

      <div className={f.fieldGroup}>
        <label className={f.label}>Primary sport <span className={f.req}>*</span></label>
        <select className={f.select} value={form.primarySport}
          onChange={e => setForm(p => ({ ...p, primarySport: e.target.value }))}>
          <option value="" disabled>Select your main sport</option>
          {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className={f.fieldGroup}>
        <label className={f.label}>Still competing? <span className={f.req}>*</span></label>
        <div className={f.toggleRow} onClick={() => setForm(p => ({ ...p, isStillCompeting: !p.isStillCompeting }))}>
          <div>
            <div className={f.toggleLabel}>
              {form.isStillCompeting ? "Yes, I'm actively competing" : "No, I've retired from competition"}
            </div>
            <div className={f.toggleSub}>Shown on your profile — helps recruiters find active athletes</div>
          </div>
          <div className={form.isStillCompeting ? `${f.toggleSwitch} ${f.toggleSwitchOn}` : f.toggleSwitch} />
        </div>
      </div>

      <div className={f.sectionDivider}>Languages</div>

      <div className={f.fieldGroup}>
        <label className={f.label}>Languages you speak</label>
        <div className={f.langGrid}>
          {LANGUAGES.map(lang => (
            <div
              key={lang}
              className={form.languages.includes(lang) ? `${f.langPill} ${f.langPillSelected}` : f.langPill}
              onClick={() => toggleLang(lang)}
            >
              {lang}
            </div>
          ))}
        </div>
      </div>

      {error && <div className={f.apiError}>{error}</div>}

      <button className={f.btnPrimary} onClick={handleContinue} disabled={loading}>
        {loading ? 'Saving profile…' : <>Continue <span>→</span></>}
      </button>
      <button className={f.btnBack} onClick={onBack} disabled={loading}>← Back</button>
    </div>
  )
}
