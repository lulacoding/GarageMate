import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Listing } from '@/types';

export type SavedListingState =
  | { status: 'active'; listing: Listing }
  | { status: 'ended'; listingId: string }
  | { status: 'unavailable'; listingId: string };

export function useSavedListings() {
  const [items, setItems] = useState<SavedListingState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    fetchSaved(uid);
  }, []);

  const fetchSaved = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const savedSnap = await getDocs(collection(db, 'users', uid, 'saved'));
      const results: SavedListingState[] = await Promise.all(
        savedSnap.docs.map(async (savedDoc) => {
          const { listingId } = savedDoc.data();
          const listingSnap = await getDoc(doc(db, 'listings', listingId));
          if (!listingSnap.exists()) return { status: 'unavailable' as const, listingId };
          const data = listingSnap.data();
          if (!data.active) return { status: 'ended' as const, listingId };
          return { status: 'active' as const, listing: { id: listingSnap.id, ...data } as Listing };
        })
      );
      setItems(results);
    } catch {
      setError('Failed to load saved listings.');
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, error };
}
