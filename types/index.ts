import { Timestamp } from 'firebase/firestore';

export interface Listing {
  id: string;
  userId: string;
  title: string;
  description: string;
  images: string[];
  address: string;
  geohash: string;
  lat: number;
  lng: number;
  startDate: Timestamp;
  endDate: Timestamp | null;
  startTime: string;
  endTime: string;
  expiresAt: Timestamp;
  active: boolean;
  createdAt: Timestamp;
}

export interface SavedItem {
  listingId: string;
  savedAt: Timestamp;
}

export interface LocationCoords {
  lat: number;
  lng: number;
}
