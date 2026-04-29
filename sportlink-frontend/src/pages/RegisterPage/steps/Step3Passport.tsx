import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Tournament } from '../../../api/sports'
import { athleteApi } from '../../../api/athlete'
import f from '../../../components/AuthWizard/authForm.module.css'

export interface Step3Data {
  tournament: string
  customTournamentName: string
  discipline: string
  year: string
  venue: string
  level: 'international' | 'national' | 'state' | 'district' | ''
  medal: 'gold' | 'silver' | 'bronze' | 'none' | ''
  result: string
  position: string
}

interface Props {
  data: Step3Data
  tournaments: Tournament[]
  athleteId: string
  sportId: string
  onBack: () => void
}

type Level = 'international' | 'national' | 'state' | 'district'
type Medal = 'gold' | 'silver' | 'bronze' | 'none'

const LEVELS: { value: Level; label: string; desc: string; dotClass: string; selClass: string }[] = [
  { value: 'international', label: 'International', desc: 'Olympics, CWG, Asian Games…',  dotClass: f.levelDotIntl,     selClass: f.levelOptSelIntl },
  { value: 'national',      label: 'National',      desc: 'Khelo India, Nationals…',      dotClass: f.levelDotNational, selClass: f.levelOptSelNational },
  { value: 'state',         label: 'State',         desc: 'State championships',           dotClass: f.levelDotState,    selClass: f.levelOptSelState },
  { value: 'district',      label: 'District',      desc: 'District / inter-school',      dotClass: f.levelDotDistrict, selClass: f.levelOptSelDistrict },
]

const MEDALS: { value: Medal; icon: string; label: string }[] = [
  { value: 'gold',   icon: '🥇', label: 'Gold' },
  { value: 'silver', icon: '🥈', label: 'Silver' },
  { value: 'bronze', icon: '🥉', label: 'Bronze' },
  { value: 'none',   icon: '🏅', label: 'Participated' },
]

export function Step3Passport({ data, tournaments, athleteId, sportId, onBack }: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState<Step3Data>(data)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showCustom = form.tournament === 'custom'

  const LEVEL_ORDER = ['international', 'national', 'state', 'district']
  const grouped = LEVEL_ORDER.reduce<Record<string, Tournament[]>>((acc, lvl) => {
    acc[lvl] = tournaments.filter(t => t.level === lvl)
    return acc
  }, {})

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      await athleteApi.addPassportEntry(athleteId, {
        sport_id: sportId,
        ...(showCustom
          ? { tournament_name_override: form.customTournamentName, level_override: form.level as Level }
          : { tournament_id: form.tournament }),
        year: Number(form.year),
        ...(form.medal ? { medal: form.medal as Medal } : {}),
        ...(form.discipline ? { notes: form.discipline } : {}),
      })
      navigate(`/profile/${athleteId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save passport entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={f.formStep}>
      <div className={f.formHeader}>
        <div className={f.formStepTag}>Step 3 — Sports Passport</div>
        <div className={f.formTitle}>BEST ACHIEVEMENT</div>
        <div className={f.formSub}>Add your biggest tournament result. You can add more after signup.</div>
      </div>

      <div className={f.sectionDivider}>Tournament</div>

      <div className={f.fieldGroup}>
        <label className={f.label}>Tournament <span className={f.req}>*</span></label>
        <select className={f.select} value={form.tournament}
          onChange={e => setForm(p => ({ ...p, tournament: e.target.value }))}>
          <option value="" disabled>Select tournament</option>
          {LEVEL_ORDER.map(lvl =>
            grouped[lvl].length > 0 ? (
              <optgroup key={lvl} label={lvl.charAt(0).toUpperCase() + lvl.slice(1)}>
                {grouped[lvl].map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
            ) : null
          )}
          <optgroup label="Other">
            <option value="custom">Other / Custom tournament…</option>
          </optgroup>
        </select>
      </div>

      {showCustom && (
        <div className={f.fieldGroup}>
          <label className={f.label}>Tournament name <span className={f.req}>*</span></label>
          <input className={f.input} type="text" placeholder="e.g. State Junior Athletics Championship"
            value={form.customTournamentName}
            onChange={e => setForm(p => ({ ...p, customTournamentName: e.target.value }))} />
        </div>
      )}

      <div className={f.fieldGroupHalf}>
        <div>
          <label className={f.label}>Event / Discipline <span className={f.req}>*</span></label>
          <input className={f.input} type="text" placeholder="e.g. 100m Sprint"
            value={form.discipline}
            onChange={e => setForm(p => ({ ...p, discipline: e.target.value }))} />
        </div>
        <div>
          <label className={f.label}>Year <span className={f.req}>*</span></label>
          <input className={f.input} type="number" placeholder="2024" min={1970} max={2026}
            value={form.year}
            onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
        </div>
      </div>

      <div className={f.fieldGroup}>
        <label className={f.label}>Venue / City</label>
        <input className={f.input} type="text" placeholder="e.g. Guwahati, Assam"
          value={form.venue}
          onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} />
      </div>

      <div className={f.sectionDivider}>Level &amp; Result</div>

      <div className={f.fieldGroup}>
        <label className={f.label}>Competition level <span className={f.req}>*</span></label>
        <div className={f.levelGrid}>
          {LEVELS.map(lv => (
            <div
              key={lv.value}
              className={form.level === lv.value ? `${f.levelOpt} ${lv.selClass}` : f.levelOpt}
              onClick={() => setForm(p => ({ ...p, level: lv.value }))}
            >
              <div className={`${f.levelDot} ${lv.dotClass}`} />
              <div>
                <div className={f.levelName}>{lv.label}</div>
                <div className={f.levelDesc}>{lv.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={f.fieldGroup}>
        <label className={f.label}>Medal / Result <span className={f.req}>*</span></label>
        <div className={f.medalGrid}>
          {MEDALS.map(m => (
            <div
              key={m.value}
              className={form.medal === m.value ? `${f.medalOpt} ${f.medalOptSelected}` : f.medalOpt}
              onClick={() => setForm(p => ({ ...p, medal: m.value }))}
            >
              <span className={f.medalIcon}>{m.icon}</span>
              <div className={f.medalName}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={f.fieldGroupHalf}>
        <div>
          <label className={f.label}>Result / Performance</label>
          <input className={f.input} type="text" placeholder="e.g. 11.34s or 6.12m"
            value={form.result}
            onChange={e => setForm(p => ({ ...p, result: e.target.value }))} />
          <div className={f.fieldHint}>Time, distance, weight, or score</div>
        </div>
        <div>
          <label className={f.label}>Finishing position</label>
          <input className={f.input} type="number" placeholder="e.g. 3" min={1}
            value={form.position}
            onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
          <div className={f.fieldHint}>Optional rank if no medal</div>
        </div>
      </div>

      {error && <div className={f.apiError}>{error}</div>}

      <button className={f.btnPrimary} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving…' : 'Create My Profile 🎽'}
      </button>
      <button className={f.btnBack} onClick={onBack} disabled={loading}>← Back</button>
    </div>
  )
}
