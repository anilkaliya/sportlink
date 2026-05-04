import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { athleteApi } from '../../api/athlete'
import { useAthleteStore } from '../../stores/athleteStore'
import { useAuthStore } from '../../stores/authStore'
import { ProfileHero } from '../../components/ProfileHero/ProfileHero'
import { SportsPassport } from '../../components/SportsPassport/SportsPassport'
import { SkillsCard } from '../../components/SkillsCard/SkillsCard'
import { EducationCard } from '../../components/EducationCard/EducationCard'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { id = '' } = useParams<{ id: string }>()
  const setAthleteData = useAthleteStore(s => s.setAthleteData)
  const clearAthlete   = useAthleteStore(s => s.clearAthlete)
  const profile   = useAthleteStore(s => s.profile)
  const passport  = useAthleteStore(s => s.passport)
  const education = useAthleteStore(s => s.education)
  const skills    = useAthleteStore(s => s.skills)
  const currentUserId = useAuthStore(s => s.userId)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['athlete', id],
    queryFn:  () => athleteApi.getById(id),
  })

  useEffect(() => {
    if (!data) return
    const { passport, education, skills, ...profileFields } = data.data
    setAthleteData({ profile: profileFields, passport, education, skills })
  }, [data, setAthleteData])

  useEffect(() => () => { clearAthlete() }, [id, clearAthlete])

  if (isLoading) return <LoadingSpinner />
  if (isError)   return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load profile'} />
  if (!profile)  return null

  const isOwner = currentUserId != null && currentUserId === profile.user_id

  return (
    <main className={styles.page}>
      <ProfileHero profile={profile} passport={passport} />
      <div className={styles.grid}>
        <div className={styles.main}>
          <SportsPassport entries={passport} isOwner={isOwner} />
          <SkillsCard skills={skills} isOwner={isOwner} />
        </div>
        <div className={styles.side}>
          <EducationCard education={education} isOwner={isOwner} />
        </div>
      </div>
    </main>
  )
}
