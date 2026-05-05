import type { PassportEntry, PbUnit } from '../types/athlete'

export interface AthleteStats {
  yearsActive: number
  goldMedals: number
  nationalTitles: number
  secondsPB: PassportEntry | undefined
  metersPB: PassportEntry | undefined
}

export function deriveStats(passport: PassportEntry[]): AthleteStats {
  const years = passport.map(p => p.year)
  const yearsActive = years.length
    ? new Date().getFullYear() - Math.min(...years)
    : 0

  const goldMedals = passport.filter(p => p.medal === 'gold').length

  const nationalTitles = passport.filter(p => {
    const level = p.tournament_level ?? p.level_override
    return level === 'national' && p.medal === 'gold'
  }).length

  const secondsPB = passport
    .filter(p => p.is_personal_best === 1 && p.pb_unit === 'seconds')
    .sort((a, b) => (a.pb_value ?? 99) - (b.pb_value ?? 99))[0]

  const metersPB = passport
    .filter(p => p.is_personal_best === 1 && p.pb_unit === 'meters')
    .sort((a, b) => (b.pb_value ?? 0) - (a.pb_value ?? 0))[0]

  return { yearsActive, goldMedals, nationalTitles, secondsPB, metersPB }
}

export function formatPb(value: number | null | undefined, unit: PbUnit | null | undefined): string {
  if (value == null || unit == null) return '—'
  switch (unit) {
    case 'seconds': return `${value}s`
    case 'meters':  return `${value}m`
    case 'kg':      return `${value}kg`
    case 'points':  return `${value} pts`
    default:        return `${value}`
  }
}
