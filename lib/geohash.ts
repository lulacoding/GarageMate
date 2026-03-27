import { geohashQueryBounds, geohashForLocation } from 'geofire-common';
import { LocationCoords } from '@/types';

export function buildGeohashQueries(
  center: LocationCoords,
  radiusKm: number
): [string, string][] {
  const radiusM = radiusKm * 1000;
  const bounds = geohashQueryBounds([center.lat, center.lng], radiusM);
  return bounds as [string, string][];
}

export function encodeGeohash(lat: number, lng: number): string {
  return geohashForLocation([lat, lng]);
}
