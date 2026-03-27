import { renderHook } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/lib/firebase', () => ({
  auth: { onAuthStateChanged: jest.fn((cb) => { cb(null); return () => {}; }) },
}));

describe('useAuth', () => {
  it('returns loading false after immediate mock resolution', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(false);
  });

  it('returns null user when unauthenticated', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });
});
