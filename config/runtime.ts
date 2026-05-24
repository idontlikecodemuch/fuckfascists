import Constants from 'expo-constants';

interface ExpoExtra {
  hasAndroidGoogleMapsApiKey?: boolean;
}

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const runtimeConfig = {
  hasAndroidGoogleMapsApiKey: extra.hasAndroidGoogleMapsApiKey === true,
} as const;
