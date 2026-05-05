import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation } from '@react-navigation/native'
import { sportsApi, type Sport, type Tournament } from '../../api/sports'
import { Step1Account, type Step1Data } from './Step1Account'
import { Step2Profile, type Step2Data } from './Step2Profile'
import { Step3Passport, type Step3Data } from './Step3Passport'
import { colors, spacing, fontSize } from '../../theme'

type WizardStep = 1 | 2 | 3

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

export function RegisterScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const resumeStep = route.params?.step as number | undefined

  const initialStep: WizardStep = resumeStep === 3 ? 3 : resumeStep === 2 ? 2 : 1

  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep)
  const [formData, setFormData] = useState<WizardFormData>(INITIAL)
  const [sports, setSports] = useState<Sport[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    sportsApi.getSports().then(setSports).catch(() => setSports([]))
    sportsApi.getTournaments().then(setTournaments).catch(() => setTournaments([]))
  }, [])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          <Text style={styles.logoAccent}>SPORT</Text>LINK
        </Text>
        <View style={styles.stepBar}>
          {[1, 2, 3].map(step => (
            <View
              key={step}
              style={[styles.stepDot, step <= currentStep && styles.stepDotActive]}
            />
          ))}
        </View>
      </View>

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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.regBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.regInk,
  },
  logoAccent: {
    color: colors.accent,
  },
  stepBar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.regBorder,
  },
  stepDotActive: {
    backgroundColor: colors.accent,
  },
})
