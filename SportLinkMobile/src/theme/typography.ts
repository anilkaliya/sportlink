import { Platform } from 'react-native'

export const fonts = {
  display: Platform.select({ ios: 'BebasNeue-Regular', android: 'BebasNeue-Regular' }) ?? 'BebasNeue-Regular',
  body: Platform.select({ ios: 'DMSans-Regular', android: 'DMSans-Regular' }) ?? 'DMSans-Regular',
  bodyMedium: Platform.select({ ios: 'DMSans-Medium', android: 'DMSans-Medium' }) ?? 'DMSans-Medium',
  bodyBold: Platform.select({ ios: 'DMSans-Bold', android: 'DMSans-Bold' }) ?? 'DMSans-Bold',
  mono: Platform.select({ ios: 'SpaceMono-Regular', android: 'SpaceMono-Regular' }) ?? 'SpaceMono-Regular',
} as const

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  display: 36,
} as const
