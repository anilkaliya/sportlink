import React, { useEffect, useState } from 'react'
import { StatusBar } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { navigationRef } from './navigation/navigationRef'
import { RootNavigator } from './navigation/RootNavigator'
import { useAuthStore } from './stores/authStore'
import { useAthleteStore } from './stores/athleteStore'
import {
  getAccessTokenFromStorage,
  getUserIdFromStorage,
  getAthleteIdFromStorage,
} from './lib/auth'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function AppContent() {
  const [hydrating, setHydrating] = useState(true)
  const setAuthenticated = useAuthStore(s => s.setAuthenticated)
  const setAccessToken = useAuthStore(s => s.setAccessToken)
  const setUserId = useAuthStore(s => s.setUserId)
  const setAthleteId = useAthleteStore(s => s.setAthleteId)

  useEffect(() => {
    async function hydrate() {
      try {
        const token = await getAccessTokenFromStorage()
        const userId = await getUserIdFromStorage()
        const athleteId = await getAthleteIdFromStorage()

        if (token && userId) {
          setAccessToken(token)
          setUserId(userId)
          setAuthenticated(true)
          if (athleteId) setAthleteId(athleteId)
        }
      } catch (err) {
        console.error('Failed to hydrate auth:', err)
      } finally {
        setHydrating(false)
      }
    }
    hydrate()
  }, [setAccessToken, setUserId, setAuthenticated, setAthleteId])

  if (hydrating) return <LoadingSpinner />

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <RootNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
