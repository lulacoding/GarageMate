module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Suppress Expo winter runtime – uses lazy getters that trigger require() outside
    // Jest's module scope, causing "import outside test scope" errors.
    'expo/src/winter/(.*)': '<rootDir>/__mocks__/expo-winter.js',
  },
};
