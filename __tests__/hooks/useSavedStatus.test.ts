import { renderHook, waitFor } from '@testing-library/react-native';
import { useSavedStatus } from '@/hooks/useSavedStatus';

jest.mock('@/lib/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'user1' } } }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  serverTimestamp: jest.fn(() => 'ts'),
}));

describe('useSavedStatus', () => {
  it('returns isSaved=false when not saved', async () => {
    const { result } = renderHook(() => useSavedStatus('listing1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isSaved).toBe(false);
  });
});
