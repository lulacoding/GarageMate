import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.displayName?.[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>
      <Text style={styles.name}>{user?.displayName ?? 'No name'}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity style={styles.btn} onPress={() => router.push('/edit-profile')}>
        <Text style={styles.btnText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => router.push('/my-listings')}>
        <Text style={styles.btnText}>My Listings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.signOutBtn]} onPress={handleSignOut}>
        <Text style={[styles.btnText, styles.signOutText]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12, marginTop: 32 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280', marginBottom: 32 },
  btn: { width: '100%', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { fontSize: 15, fontWeight: '500' },
  signOutBtn: { borderColor: '#fca5a5', marginTop: 8 },
  signOutText: { color: '#dc2626' },
});
