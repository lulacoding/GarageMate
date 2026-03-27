import { renderHook, waitFor } from '@testing-library/react-native';
import { useListings } from '@/hooks/useListings';

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
}));
jest.mock('@/lib/geohash', () => ({
  buildGeohashQueries: jest.fn(() => [['a', 'z']]),
}));
jest.mock('geofire-common', () => ({
  distanceBetween: jest.fn(() => 5),
}));

describe('useListings', () => {
  it('returns empty array and loading=false after fetch', async () => {
    const { result } = renderHook(() =>
      useListings({ lat: -37.8136, lng: 144.9631 }, 20)
    );
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.listings).toEqual([]);
  });
});
