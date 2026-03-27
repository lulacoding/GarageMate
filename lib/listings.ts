import { Timestamp, addDoc, collection, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { encodeGeohash } from '@/lib/geohash';

interface ListingInput {
  userId: string;
  title: string;
  description: string;
  images: string[];
  address: string;
  lat: number;
  lng: number;
  startDate: Timestamp;
  endDate: Timestamp | null;
  startTime: string;
  endTime: string;
}

export function buildListingPayload(input: ListingInput) {
  return {
    ...input,
    geohash: encodeGeohash(input.lat, input.lng),
    expiresAt: input.endDate ?? input.startDate,
    active: true,
    createdAt: serverTimestamp(),
  };
}

export async function uploadListingImages(uris: string[], userId: string): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of uris) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `listings/${userId}/${Date.now()}_${Math.random()}`);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    urls.push(url);
  }
  return urls;
}

export async function createListing(input: ListingInput): Promise<string> {
  const payload = buildListingPayload(input);
  const docRef = await addDoc(collection(db, 'listings'), payload);
  return docRef.id;
}

export async function updateListing(listingId: string, input: Partial<ListingInput> & { endDate?: Timestamp | null }): Promise<void> {
  const updates: Record<string, any> = { ...input };
  if ('startDate' in input || 'endDate' in input) {
    updates.expiresAt = input.endDate ?? input.startDate;
  }
  if ('lat' in input && 'lng' in input) {
    updates.geohash = encodeGeohash(input.lat!, input.lng!);
  }
  await updateDoc(doc(db, 'listings', listingId), updates);
}
