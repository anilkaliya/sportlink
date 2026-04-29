import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { sportsApi, type Sport, type Tournament } from '../../api/sports'
import { AuthWizard } from '../../components/AuthWizard/AuthWizard'
import { WizardLeftPanel, type WizardStep } from '../../components/AuthWizard/WizardLeftPanel'
import { MobileStepBar } from '../../components/AuthWizard/MobileStepBar'
import { Step1Account, type Step1Data } from './steps/Step1Account'
import { Step2Profile, type Step2Data } from './steps/Step2Profile'
import { Step3Passport, type Step3Data } from './steps/Step3Passport'
import { StepSuccess } from './steps/StepSuccess'
import styles from './RegisterPage.module.css'

interface WizardFormData {
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
}

const INITIAL: WizardFormData = {
  step1: { email: '', phone: '', password: '', termsAccepted: false, userId: '' },
  step2: { firstName: '', lastName: '', dateOfBirth: '', gender: '', city: '', state: '', primarySport: '', isStillCompeting: true, languages: ['Hindi', 'English'], athleteId: '' },
  step3: { tournament: '', customTournamentName: '', discipline: '', year: '', venue: '', level: '', medal: '', result: '', position: '' },
}

const LEFT_PANEL_CONTENT: Record<1 | 2 | 3, { tag: string; line1: string; line2: string; body: string }> = {
  1: { tag: 'Step 1 of 3', line1: 'YOUR CAREER', line2: 'STARTS HERE.', body: 'SportLink is where Indian athletes build their professional identity — beyond the track, beyond the field.' },
  2: { tag: 'Step 2 of 3', line1: 'BUILD YOUR', line2: 'IDENTITY.', body: 'This is what recruiters, coaches, and scouts see first. Make it count.' },
  3: { tag: 'Step 3 of 3 — Final Step', line1: 'STAMP YOUR', line2: 'PASSPORT.', body: 'Every great athlete has a defining achievement. Add yours — this is what unlocks job matching on day one.' },
}

export function RegisterPage() {
  const location = useLocation()
  const resumeStep = (location.state as { step?: number } | null)?.step

  const initialStep: WizardStep = resumeStep === 3 ? 3 : resumeStep === 2 ? 2 : 1

  const initialFormData: WizardFormData = {
    ...INITIAL,
    step1: {
      ...INITIAL.step1,
      userId: sessionStorage.getItem('sl_user_id') ?? '',
    },
    step2: {
      ...INITIAL.step2,
      athleteId: sessionStorage.getItem('sl_athlete_id') ?? '',
      primarySport: sessionStorage.getItem('sl_sport_id') ?? '',
    },
  }

  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep)
  const [formData, setFormData] = useState<WizardFormData>(initialFormData)
  const [sports, setSports] = useState<Sport[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    sportsApi.getSports().then(setSports).catch(() => setSports([]))
    sportsApi.getTournaments().then(setTournaments).catch(() => setTournaments([]))
  }, [])

  if (currentStep === 'success') {
    return (
      <div className={styles.successRoot}>
        <nav className={styles.successNav}>
          <Link to="/" className={styles.successLogo}>
            <span className={styles.successLogoAccent}>SPORT</span>LINK
          </Link>
          <div className={styles.successNavRight}>Welcome aboard 🎉</div>
        </nav>
        <StepSuccess
          firstName={formData.step2.firstName}
          lastName={formData.step2.lastName}
          sport={formData.step2.primarySport}
          state={formData.step2.state}
          athleteId={formData.step2.athleteId}
        />
      </div>
    )
  }

  const stepNum = currentStep as 1 | 2 | 3
  const lp = LEFT_PANEL_CONTENT[stepNum]

  return (
    <>
      <MobileStepBar step={currentStep} />
      <AuthWizard
        navRight={
          currentStep === 1
            ? <span>Already a member? <Link to="/signin">Sign in</Link></span>
            : <span>Step {stepNum} of 3</span>
        }
        leftPanel={
          <WizardLeftPanel
            step={currentStep}
            tag={lp.tag}
            headingLine1={lp.line1}
            headingLine2={lp.line2}
            body={lp.body}
          />
        }
      >
        {currentStep === 1 && (
          <Step1Account
            data={formData.step1}
            onNext={d => { setFormData(p => ({ ...p, step1: d })); setCurrentStep(2) }}
          />
        )}
        {currentStep === 2 && (
          <Step2Profile
            data={formData.step2}
            sports={sports}
            userId={formData.step1.userId}
            onNext={d => { setFormData(p => ({ ...p, step2: d })); setCurrentStep(3) }}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <Step3Passport
            data={formData.step3}
            tournaments={tournaments}
            athleteId={formData.step2.athleteId}
            sportId={formData.step2.primarySport}
            onBack={() => setCurrentStep(2)}
          />
        )}
      </AuthWizard>
    </>
  )
}
