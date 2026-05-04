import styles from './ProfileHero.module.css'
import type { AthleteProfile, PassportEntry } from '../../types/athlete'
import { parseLanguages } from '../../types/athlete'
import { deriveStats, formatPb } from '../../lib/stats'
import { ConnectionButton } from '../ConnectionButton/ConnectionButton'
import { useAuthStore } from '../../stores/authStore'

interface StatCellProps {
  value: string
  label: string
  color: 'accent' | 'gold' | 'teal'
}

const colorClass = {
  accent: styles.colorAccent,
  gold:   styles.colorGold,
  teal:   styles.colorTeal,
}

function StatCell({ value, label, color }: StatCellProps) {
  return (
    <div className={styles.statCell}>
      <span className={`${styles.statVal} ${colorClass[color]}`}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

interface Props {
  profile: AthleteProfile
  passport: PassportEntry[]
}

export function ProfileHero({ profile, passport }: Props) {
  const currentUserId = useAuthStore(s => s.userId)
  const stats = deriveStats(passport)
  const languages = parseLanguages(profile.languages)
  const headline = profile.bio?.split('—')[0]?.trim() ?? profile.bio ?? ''

  const pbSecLabel = stats.secondsPB ? `${stats.secondsPB.notes ?? '100m'} PB` : '100m PB'
  const pbMetLabel = stats.metersPB  ? `${stats.metersPB.notes  ?? 'LJ'} PB`  : 'Distance PB'

  return (
    <div className={styles.hero} style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className={styles.cover} />

      <div className={styles.profileMain}>
        <div className={styles.profileTop}>
          <div className={styles.avatar}>
            {profile.profile_photo_url
              ? <img src={profile.profile_photo_url} alt={profile.full_name} className={styles.avatarImg} />
              : <span className={styles.avatarEmoji}>🏃</span>
            }
          </div>

          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{profile.full_name}</h1>
            {headline && <p className={styles.sport}>⚡ {headline}</p>}
            <p className={styles.meta}>
              {profile.city && profile.state && `📍 ${profile.city}, ${profile.state}`}
              {languages.length > 0 && ` · 🗣 ${languages.join(', ')}`}
            </p>
          </div>

          <div className={styles.actions}>
            <ConnectionButton targetUserId={profile.user_id} currentUserId={currentUserId ?? ''} />
            <button className={styles.btnMore}>⋮</button>
          </div>
        </div>

        <div className={styles.statsRow}>
          <StatCell value={`${stats.yearsActive}`}                                         label="Years Active"    color="accent" />
          <StatCell value={`${stats.goldMedals}`}                                           label="Gold Medals"     color="gold"   />
          <StatCell value={formatPb(stats.secondsPB?.pb_value, stats.secondsPB?.pb_unit)}  label={pbSecLabel}      color="accent" />
          <StatCell value={formatPb(stats.metersPB?.pb_value,  stats.metersPB?.pb_unit)}   label={pbMetLabel}      color="teal"   />
          <StatCell value={`${stats.nationalTitles}`}                                       label="Nat. Titles"     color="accent" />
        </div>
      </div>
    </div>
  )
}
