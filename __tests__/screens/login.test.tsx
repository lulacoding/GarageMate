import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  GoogleAuthProvider: { credential: jest.fn() },
  OAuthProvider: jest.fn(() => ({ credential: jest.fn() })),
  signInWithCredential: jest.fn(),
  getAuth: jest.fn(),
}));
jest.mock('@/lib/firebase', () => ({ auth: {} }));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }), Link: 'Link' }));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signIn: jest.fn() },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));
jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButton: 'AppleAuthenticationButton',
  AppleAuthenticationButtonType: { SIGN_IN: 0 },
  AppleAuthenticationButtonStyle: { BLACK: 0 },
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  signInAsync: jest.fn(),
}));
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid'),
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

describe('LoginScreen', () => {
  it('renders email and password inputs', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('shows error when fields are empty on submit', async () => {
    const { getByText, getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => expect(getByTestId('error-message')).toBeTruthy());
  });
});
