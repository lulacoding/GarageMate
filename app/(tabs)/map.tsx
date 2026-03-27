import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useListings } from '@/hooks/useListings';
import { Listing, LocationCoords } from '@/types';

// Platform-conditional map import
const MapComponent = Platform.OS === 'web'
  ? require('@/components/MapWeb').MapWeb
  : require('@/components/MapNative').MapNative;

export default function MapScreen() {
  const [center, setCenter] = useState<LocationCoords | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const router = useRouter();

  const { listings, loading } = useListings(center, 20);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError(true); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setCenter({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  if (!center && !locationError) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Location permission required to show the map.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#2563eb" />
        </View>
      )}
      <MapComponent
        center={center!}
        listings={listings}
        onSelectListing={setSelectedListing}
      />
      {selectedListing && (
        <View style={styles.bottomCard}>
          <Text style={styles.cardTitle} numberOfLines={1}>{selectedListing.title}</Text>
          <Text style={styles.cardAddress} numberOfLines={1}>{selectedListing.address}</Text>
          <Text style={styles.cardDate}>
            {selectedListing.startDate.toDate().toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}{selectedListing.startTime}–{selectedListing.endTime}
          </Text>
          <View style={styles.cardButtons}>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => router.push(`/listing/${selectedListing.id}`)}
            >
              <Text style={styles.viewBtnText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedListing(null)}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6b7280' },
  errorText: { color: '#dc2626', textAlign: 'center' },
  loadingOverlay: { position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: '#fff', borderRadius: 8, padding: 8, elevation: 4 },
  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, elevation: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
  cardTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  cardAddress: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  cardDate: { fontSize: 13, color: '#9ca3af', marginBottom: 12 },
  cardButtons: { flexDirection: 'row', gap: 8 },
  viewBtn: { flex: 1, backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  viewBtnText: { color: '#fff', fontWeight: '600' },
  closeBtn: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#6b7280' },
});
