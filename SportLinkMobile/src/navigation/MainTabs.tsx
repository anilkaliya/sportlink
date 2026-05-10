import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text, StyleSheet } from 'react-native'
import { CommonActions } from '@react-navigation/native'
import type { MainTabParamList, ProfileStackParamList } from './types'
import { colors } from '../theme'
import { useAthleteStore } from '../stores/athleteStore'
import { DashboardScreen } from '../screens/DashboardScreen'
import { AthletesScreen } from '../screens/AthletesScreen'
import { ConnectionsScreen } from '../screens/ConnectionsScreen'
import { RequestsScreen } from '../screens/RequestsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'

const Tab = createBottomTabNavigator<MainTabParamList>()
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>()

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    </ProfileStack.Navigator>
  )
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Athletes: '👥',
    Connections: '🔗',
    Requests: '🤝',
    ProfileTab: '👤',
  }
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={{ fontSize: 20 }}>
        {icons[label] ?? '📱'}
      </Text>
    </View>
  )
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#dcfce7',
  },
})

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarInactiveBackgroundColor: colors.surface,
        tabBarActiveBackgroundColor: colors.surface,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Athletes" component={AthletesScreen} />
      <Tab.Screen name="Connections" component={ConnectionsScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'Profile' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault()
            const athleteId = useAthleteStore.getState().athlete_id
            // Reset the stack so ProfileScreen remounts with the current user's ID
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: 'ProfileTab',
                    state: {
                      routes: [
                        {
                          name: 'Profile',
                          params: athleteId ? { id: athleteId } : undefined,
                        },
                      ],
                    },
                  },
                ],
              })
            )
          },
        })}
      />
    </Tab.Navigator>
  )
}
