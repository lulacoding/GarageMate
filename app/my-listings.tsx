import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { db, auth } from '@/lib/firebase';
import { ListingCard } from '@/components/ListingCard';
import { Listing } from '@/types';

export default function MyListingsScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDocs(
      query(collection(db, 'listings'), where('userId', '==', uid), orderBy('createdAt', 'desc'))
    ).then((snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
      setLoading(false);
    });
  }, []);

  const handleActions = (listing: Listing) => {
    Alert.alert(listing.title, 'What would you like to do?', [
      {
        text: 'Edit',
        onPress: () => router.push({ pathname: '/(tabs)/add', params: { listingId: listing.id } }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete listing?', 'This will remove it from public view.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await updateDoc(doc(db, 'listings', listing.id), { active: false });
                setListings((prev) => prev.filter((l) => l.id !== listing.id));
              },
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 48 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Listings</Text>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard listing={item} onPress={() => handleActions(item)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>You haven't posted any listings yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  heading: { fontSize: 22, fontWeight: '700', padding: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
});
