import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  updateProfile, reauthenticateWithCredential,
  EmailAuthProvider, updatePassword, verifyBeforeUpdateEmail
} from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';

export default function EditProfileScreen() {
  const user = auth.currentUser!;
  const router = useRouter();
  const isEmailProvider = user.providerData[0]?.providerId === 'password';

  const [displayName, setDisplayName] = useState(user.displayName ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reauth = async () => {
    const credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await reauthenticateWithCredential(user, credential);
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) { setError('Display name cannot be empty.'); return; }
    setLoading(true); setError('');
    try {
      await updateProfile(user, { displayName });
      Alert.alert('Saved', 'Display name updated.');
    } catch { setError('Failed to update display name.'); }
    finally { setLoading(false); }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !currentPassword) { setError('Enter your current password and new email.'); return; }
    setLoading(true); setError('');
    try {
      await reauth();
      await verifyBeforeUpdateEmail(user, newEmail);
      Alert.alert(
        'Verification email sent',
        `A verification link has been sent to ${newEmail}. Your email address will update after you click that link.`
      );
      setNewEmail(''); setCurrentPassword('');
    } catch (e: any) {
      if (e.code === 'auth/wrong-password') setError('Current password is incorrect.');
      else setError('Failed to update email. Please try again.');
    } finally { setLoading(false); }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !currentPassword) { setError('Enter your current and new password.'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await reauth();
      await updatePassword(user, newPassword);
      Alert.alert('Saved', 'Password updated.');
      setNewPassword(''); setCurrentPassword('');
    } catch (e: any) {
      if (e.code === 'auth/wrong-password') setError('Current password is incorrect.');
      else setError('Failed to update password. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Edit Profile</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Display Name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
      <TouchableOpacity style={styles.btn} onPress={handleSaveDisplayName} disabled={loading}>
        <Text style={styles.btnText}>Save Name</Text>
      </TouchableOpacity>

      {isEmailProvider && (
        <>
          <Text style={styles.sectionTitle}>Update Email or Password</Text>
          <Text style={styles.label}>Current Password (required for changes below)</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Current password" />

          <Text style={styles.label}>New Email</Text>
          <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" placeholder="New email address" />
          <TouchableOpacity style={styles.btn} onPress={handleUpdateEmail} disabled={loading}>
            <Text style={styles.btnText}>Update Email</Text>
          </TouchableOpacity>

          <Text style={styles.label}>New Password</Text>
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="New password (min 8 chars)" />
          <TouchableOpacity style={styles.btn} onPress={handleUpdatePassword} disabled={loading}>
            <Text style={styles.btnText}>Update Password</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 },
  btn: { backgroundColor: '#2563eb', padding: 13, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 12 },
  cancelBtn: { marginTop: 16, marginBottom: 32, alignItems: 'center' },
  cancelText: { color: '#6b7280', fontSize: 15 },
});
