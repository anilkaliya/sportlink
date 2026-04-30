import { useState } from 'react'
import { athleteApi } from '../../api/athlete'
import type { Skill, SkillCategory } from '../../types/athlete'
import styles from './SkillsCard.module.css'

const SUGGESTIONS = [
  'Sprint Training', 'Strength & Conditioning', 'Sports Psychology', 'Team Leadership',
  'Public Speaking', 'Goal Setting', 'Performance Analysis', 'Injury Rehabilitation',
  'Sports Nutrition', 'Coaching', 'Commentary', 'Video Analysis',
  'Tactical Planning', 'Discipline', 'Time Management',
]
const CATEGORIES: [SkillCategory, string][] = [
  ['sport_specific', '🏃 Sport Specific'], ['soft_skill', '🤝 Soft Skill'],
  ['technical', '📊 Technical'], ['leadership', '🎯 Leadership'],
]

interface PendingSkill {
  skill_name: string
  category: SkillCategory
}

interface Props {
  athleteId: string
  onSuccess: (skills: Skill[]) => void
  onCancel: () => void
}

export function AddSkillForm({ athleteId, onSuccess, onCancel }: Props) {
  const [skillName, setSkillName] = useState('')
  const [category, setCategory] = useState<SkillCategory | ''>('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [pending, setPending] = useState<PendingSkill[]>([])
  const [inputError, setInputError] = useState('')
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  const filtered = skillName.length >= 1
    ? SUGGESTIONS.filter(s => s.toLowerCase().includes(skillName.toLowerCase()))
    : []

  function addToPending() {
    if (skillName.trim().length < 2) { setInputError('Min 2 characters'); return }
    if (!category) { setInputError('Select a category'); return }
    if (pending.some(p => p.skill_name.toLowerCase() === skillName.trim().toLowerCase())) {
      setInputError('Already in list'); return
    }
    setPending(prev => [...prev, { skill_name: skillName.trim(), category: category as SkillCategory }])
    setSkillName('')
    setCategory('')
    setInputError('')
  }

  function removePending(index: number) {
    setPending(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (pending.length === 0) { setInputError('Add at least one skill'); return }
    setSaving(true); setApiError('')
    try {
      const res = await athleteApi.addSkills(athleteId, pending)
      onSuccess(res.data)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.formInner}>
      <div className={styles.field} style={{ position: 'relative' }}>
        <input
          className={styles.input}
          placeholder="Skill name"
          value={skillName}
          onChange={e => { setSkillName(e.target.value); setInputError(''); setShowSuggestions(true) }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToPending() } }}
          autoComplete="off"
        />
        {showSuggestions && filtered.length > 0 && (
          <div className={styles.suggestions}>
            {filtered.map(s => (
              <div key={s} className={styles.suggestion} onMouseDown={() => { setSkillName(s); setShowSuggestions(false) }}>{s}</div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.field}>
        <div className={styles.optionRow}>
          {CATEGORIES.map(([v, l]) => (
            <button key={v} type="button" className={`${styles.optionBtn} ${category === v ? styles.optionSelected : ''}`} onClick={() => { setCategory(v); setInputError('') }}>{l}</button>
          ))}
        </div>
      </div>
      <div className={styles.addRowActions}>
        <button className={styles.btnAddMore} type="button" onClick={addToPending}>+ Add to list</button>
        {inputError && <span className={styles.err}>{inputError}</span>}
      </div>
      {pending.length > 0 && (
        <div className={styles.pendingList}>
          {pending.map((p, i) => (
            <div key={i} className={styles.pendingItem}>
              <span className={styles.pendingName}>{p.skill_name}</span>
              <span className={styles.pendingCat}>{CATEGORIES.find(([v]) => v === p.category)?.[1]}</span>
              <button className={styles.removeBtn} type="button" onClick={() => removePending(i)}>×</button>
            </div>
          ))}
        </div>
      )}
      {apiError && <p className={styles.apiErr}>{apiError}</p>}
      <div className={styles.formActions}>
        <button className={styles.btnSave} onClick={handleSave} disabled={saving || pending.length === 0}>
          {saving ? 'Saving…' : `Save ${pending.length > 0 ? `(${pending.length})` : ''}`}
        </button>
        <button className={styles.btnCancel} onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  )
}
