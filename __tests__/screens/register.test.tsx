import React from 'react';
import { render } from '@testing-library/react-native';
import RegisterScreen from '@/app/(auth)/register';

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  updateProfile: jest.fn(),
  getAuth: jest.fn(),
}));
jest.mock('@/lib/firebase', () => ({ auth: {} }));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }), Link: 'Link' }));

describe('RegisterScreen', () => {
  it('renders all required fields', () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    expect(getByPlaceholderText('First Name')).toBeTruthy();
    expect(getByPlaceholderText('Last Name')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });
});
