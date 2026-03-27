import { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import { useListings } from '@/hooks/useListings';
import { ListingCard } from '@/components/ListingCard';
import { LocationCoords, Listing } from '@/types';

const PLACES_KEY = Constants.expoConfig?.extra?.googlePlacesApiKey ?? '';

const DATE_FILTERS = ['All', 'Today', 'This Week', 'This Month'] as const;
type DateFilter = typeof DATE_FILTERS[number];

function applyDateFilter(listings: Listing[], filter: DateFilter): Listing[] {
  if (filter === 'All') return listings;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return listings.filter((l) => {
    const d = l.startDate.toDate();
    if (filter === 'Today') return d >= today && d < new Date(today.getTime() + 86400000);
    if (filter === 'This Week') {
      const weekEnd = new Date(today.getTime() + 7 * 86400000);
      return d >= today && d < weekEnd;
    }
    if (filter === 'This Month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

export default function HomeScreen() {
  const [center, setCenter] = useState<LocationCoords | null>(null);
  const [radius, setRadius] = useState(20);
  const [dateFilter, setDateFilter] = useState<DateFilter>('All');
  const [locationError, setLocationError] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const router = useRouter();
  const { listings, loading, error, refetch } = useListings(center, radius);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError(true); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setCenter({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const filtered = applyDateFilter(listings, dateFilter);
  const paged = filtered.slice(0, page * PAGE_SIZE);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {DATE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, dateFilter === f && styles.chipActive]}
            onPress={() => setDateFilter(f)}
          >
            <Text style={[styles.chipText, dateFilter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>Radius: {radius}km</Text>
        <Slider
          style={{ flex: 1 }}
          minimumValue={1}
          maximumValue={50}
          step={1}
          value={radius}
          onSlidingComplete={(v) => setRadius(Math.round(v))}
        />
      </View>

      {locationError && (
        <View style={styles.suburbSearch}>
          <Text style={styles.warning}>Location unavailable. Search by suburb:</Text>
          <GooglePlacesAutocomplete
            placeholder="Enter suburb"
            onPress={(_data, details) => {
              if (!details) return;
              setCenter({
                lat: details.geometry.location.lat,
                lng: details.geometry.location.lng,
              });
            }}
            query={{ key: PLACES_KEY, language: 'en', types: '(cities)' }}
            fetchDetails
            styles={{ container: { marginTop: 4 }, textInput: styles.suburbInput }}
          />
        </View>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 32 }} size="large" />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={paged}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
        )}
        onEndReached={() => { if (paged.length < filtered.length) setPage((p) => p + 1); }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No garage sales nearby.</Text> : null}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  sliderLabel: { fontSize: 13, color: '#6b7280', marginRight: 8, width: 80 },
  warning: { color: '#d97706', fontSize: 13, marginBottom: 4 },
  suburbSearch: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fffbeb' },
  suburbInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  errorText: { color: '#dc2626', textAlign: 'center', marginTop: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
});
