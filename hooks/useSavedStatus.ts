import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export function useSavedStatus(listingId: string) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    const ref = doc(db, 'users', uid, 'saved', listingId);
    getDoc(ref).then((snap) => {
      setIsSaved(snap.exists());
      setLoading(false);
    });
  }, [listingId]);

  const toggle = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'saved', listingId);
    if (isSaved) {
      await deleteDoc(ref);
      setIsSaved(false);
    } else {
      await setDoc(ref, { listingId, savedAt: serverTimestamp() });
      setIsSaved(true);
    }
  };

  return { isSaved, loading, toggle };
}
