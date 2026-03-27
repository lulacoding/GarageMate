import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { buildGeohashQueries } from '@/lib/geohash';
import { Listing, LocationCoords } from '@/types';
import { distanceBetween } from 'geofire-common';

export function useListings(center: LocationCoords | null, radiusKm: number) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!center) return;
    fetchListings(center, radiusKm);
  }, [center?.lat, center?.lng, radiusKm]);

  const fetchListings = async (center: LocationCoords, radiusKm: number) => {
    setLoading(true);
    setError(null);
    try {
      const bounds = buildGeohashQueries(center, radiusKm);
      const promises = bounds.map(([lower, upper]) =>
        getDocs(
          query(
            collection(db, 'listings'),
            where('active', '==', true),
            where('geohash', '>=', lower),
            where('geohash', '<=', upper)
          )
        )
      );
      const snapshots = await Promise.all(promises);
      const seen = new Set<string>();
      const results: Listing[] = [];
      snapshots.forEach((snap) => {
        snap.docs.forEach((doc) => {
          if (!seen.has(doc.id)) {
            seen.add(doc.id);
            const data = doc.data();
            // distanceBetween returns km — compare directly to radiusKm
            const dist = distanceBetween([data.lat, data.lng], [center.lat, center.lng]);
            if (dist <= radiusKm) {
              results.push({ id: doc.id, ...data } as Listing);
            }
          }
        });
      });
      results.sort((a, b) => a.startDate.toMillis() - b.startDate.toMillis());
      setListings(results);
    } catch {
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { listings, loading, error, refetch: () => center && fetchListings(center, radiusKm) };
}
