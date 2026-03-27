import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSavedListings } from '@/hooks/useSavedListings';
import { ListingCard } from '@/components/ListingCard';

export default function SavedScreen() {
  const { items, loading, error } = useSavedListings();
  const router = useRouter();

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 48 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Saved</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={(item, i) => item.status === 'active' ? item.listing.id : `${item.status}-${i}`}
        renderItem={({ item }) => {
          if (item.status === 'active') {
            return (
              <ListingCard
                listing={item.listing}
                onPress={() => router.push(`/listing/${item.listing.id}`)}
              />
            );
          }
          return (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>
                {item.status === 'ended' ? 'This sale has ended.' : 'This listing is no longer available.'}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No saved listings yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  heading: { fontSize: 22, fontWeight: '700', padding: 16 },
  error: { color: '#dc2626', paddingHorizontal: 16 },
  placeholderCard: { marginHorizontal: 16, marginVertical: 6, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 12 },
  placeholderText: { color: '#9ca3af', fontSize: 14 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
});
