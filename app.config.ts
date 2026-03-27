import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GarageMate',
  slug: 'garagemate',
  version: '1.0.0',
  extra: {
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    googlePlacesApiKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  },
  plugins: [
    'expo-router',
    'expo-location',
    ['expo-image-picker', { photosPermission: 'Allow GarageMate to select photos for listings.' }],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY,
      },
    ],
    '@react-native-community/datetimepicker',
  ],
  scheme: 'garagemate',
  web: { bundler: 'metro' },
  ios: { supportsTablet: true, bundleIdentifier: 'com.garagemate.app' },
  android: {
    package: 'com.garagemate.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
});
