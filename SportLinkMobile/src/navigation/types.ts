import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'

// Auth stack
export type AuthStackParamList = {
  SignIn: undefined
  Register: { step?: number } | undefined
  ForgotPassword: undefined
}

// Main tabs
export type MainTabParamList = {
  Dashboard: undefined
  Athletes: undefined
  Connections: undefined
  MessagesTab: NavigatorScreenParams<MessagesStackParamList>
  Requests: undefined
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>
}

// Messages stack (nested in tab)
export type MessagesStackParamList = {
  Inbox: undefined
  Chat: { conversationId: string }
}

// Profile stack (nested in tab)
export type ProfileStackParamList = {
  Profile: { id: string }
}

// Root
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>
  Main: NavigatorScreenParams<MainTabParamList>
}

// Screen prop helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>
