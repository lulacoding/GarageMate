import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Linking, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useSavedStatus } from '@/hooks/useSavedStatus';
import { Listing } from '@/types';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { isSaved, toggle } = useSavedStatus(id);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'listings', id)).then((snap) => {
      if (!snap.exists()) {
        setNotFound(true);
      } else {
        const data = snap.data();
        const isOwner = auth.currentUser?.uid === data.userId;
        if (!data.active && !isOwner) {
          setNotFound(true);
        } else {
          setListing({ id: snap.id, ...data } as Listing);
        }
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 48 }} size="large" />;
  if (notFound || !listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>This listing is no longer available.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>Go back</Text></TouchableOpacity>
      </View>
    );
  }

  const openMaps = () => {
    const url = Platform.OS === 'ios'
      ? `maps://?q=${listing.lat},${listing.lng}`
      : `geo:${listing.lat},${listing.lng}?q=${encodeURIComponent(listing.address)}`;
    Linking.openURL(url);
  };

  const startDate = listing.startDate.toDate().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });
  const endDate = listing.endDate
    ? listing.endDate.toDate().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })
    : null;

  return (
    <ScrollView style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {listing.images.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.image} />
        ))}
      </ScrollView>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title}>{listing.title}</Text>
          <TouchableOpacity onPress={toggle} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>{isSaved ? '★ Saved' : '☆ Save'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.address}>{listing.address}</Text>
        <Text style={styles.date}>{startDate}{endDate ? ` – ${endDate}` : ''}</Text>
        <Text style={styles.time}>{listing.startTime} – {listing.endTime}</Text>
        <Text style={styles.description}>{listing.description}</Text>
        <TouchableOpacity style={styles.mapsBtn} onPress={openMaps}>
          <Text style={styles.mapsBtnText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageScroll: { height: 240 },
  image: { width: 320, height: 240, marginRight: 2 },
  content: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', flex: 1, marginRight: 12 },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#2563eb', borderRadius: 8 },
  saveBtnText: { color: '#2563eb', fontWeight: '600' },
  address: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  date: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  time: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  mapsBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  mapsBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  notFound: { fontSize: 16, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  back: { color: '#2563eb', fontSize: 15 },
});
