import { renderHook, waitFor } from '@testing-library/react-native';
import { useSavedListings } from '@/hooks/useSavedListings';

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'u1' } },
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

describe('useSavedListings', () => {
  it('returns empty array when no saved items', async () => {
    const { result } = renderHook(() => useSavedListings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });
});
