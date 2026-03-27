import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Listing } from '@/types';

interface Props {
  listing: Listing;
  onPress: () => void;
}

export function ListingCard({ listing, onPress }: Props) {
  const date = listing.startDate.toDate().toLocaleDateString('en-AU', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const endDate = listing.endDate
    ? ` – ${listing.endDate.toDate().toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}`
    : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {listing.images[0] ? (
        <Image source={{ uri: listing.images[0] }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.address} numberOfLines={1}>{listing.address}</Text>
        <Text style={styles.date}>{date}{endDate} · {listing.startTime}–{listing.endTime}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginVertical: 6, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  image: { width: 88, height: 88 },
  imagePlaceholder: { backgroundColor: '#e5e7eb' },
  content: { flex: 1, padding: 12, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  address: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  date: { fontSize: 12, color: '#9ca3af' },
});
