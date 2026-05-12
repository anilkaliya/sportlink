import React, { useEffect, useState } from 'react'
import { StatusBar, LogBox, View, Text, StyleSheet, ScrollView } from 'react-native'
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
import { wsManager } from './lib/websocket'

if (__DEV__) {
  LogBox.ignoreLogs([])
}

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
          wsManager.connect()
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

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={ebStyles.container}>
          <Text style={ebStyles.title}>Something went wrong</Text>
          <ScrollView style={ebStyles.scroll}>
            <Text style={ebStyles.message}>{this.state.error?.message}</Text>
            <Text style={ebStyles.stack}>{this.state.error?.stack}</Text>
          </ScrollView>
        </View>
      )
    }
    return this.props.children
  }
}

const ebStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#ff4c6a', marginBottom: 12 },
  scroll: { maxHeight: '70%' },
  message: { fontSize: 16, color: '#fff', marginBottom: 12 },
  stack: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
})

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
