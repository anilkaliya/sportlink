import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { RootStackParamList } from './types'
import { useAuthStore } from '../stores/authStore'
import { AuthStack } from './AuthStack'
import { MainTabs } from './MainTabs'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  )
}
