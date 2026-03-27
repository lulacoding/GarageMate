import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Timestamp } from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth } from '@/lib/firebase';
import { uploadListingImages, createListing, updateListing } from '@/lib/listings';
import { validateListingForm } from '@/lib/validation';
import Constants from 'expo-constants';

const PLACES_KEY = Constants.expoConfig?.extra?.googlePlacesApiKey ?? '';

export default function AddListingScreen() {
  const router = useRouter();
  const { listingId } = useLocalSearchParams<{ listingId?: string }>();
  const isEdit = !!listingId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() + 86400000));
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('14:00');
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const timeStringToDate = (t: string): Date => {
    const [h, m] = t.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0); return d;
  };
  const dateToTimeString = (d: Date): string =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const pickImage = async () => {
    if (images.length + existingImageUrls.length >= 3) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImages((prev) => [...prev, result.assets[0].uri]);
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
    else setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    const allImages = [...existingImageUrls, ...images];
    const formValues = {
      title, description, images: allImages,
      address, lat: lat ?? undefined, lng: lng ?? undefined,
      startDate: Timestamp.fromDate(startDate),
      endDate: endDate ? Timestamp.fromDate(endDate) : null,
      startTime, endTime,
    };
    const validationErrors = validateListingForm(formValues as any);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    setSubmitting(true);
    setErrors({});
    try {
      let uploadedUrls: string[] = [];
      if (images.length > 0) {
        uploadedUrls = await uploadListingImages(images, auth.currentUser.uid);
      }
      const finalImages = [...existingImageUrls, ...uploadedUrls];
      const payload = {
        userId: auth.currentUser.uid,
        title, description,
        images: finalImages,
        address, lat: lat!, lng: lng!,
        startDate: Timestamp.fromDate(startDate),
        endDate: endDate ? Timestamp.fromDate(endDate) : null,
        startTime, endTime,
      };
      if (isEdit && listingId) {
        await updateListing(listingId, payload);
      } else {
        await createListing(payload);
      }
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Failed to save listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>{isEdit ? 'Edit Listing' : 'Add Garage Sale'}</Text>

      <View style={styles.imageRow}>
        {existingImageUrls.map((uri, i) => (
          <View key={`e-${i}`} style={styles.imageThumb}>
            <Image source={{ uri }} style={styles.thumbImg} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i, true)}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {images.map((uri, i) => (
          <View key={`n-${i}`} style={styles.imageThumb}>
            <Image source={{ uri }} style={styles.thumbImg} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i, false)}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {images.length + existingImageUrls.length < 3 && (
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
            <Text style={styles.addImageText}>+ Photo</Text>
          </TouchableOpacity>
        )}
      </View>
      {errors.images && <Text style={styles.error}>{errors.images}</Text>}

      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      {errors.title && <Text style={styles.error}>{errors.title}</Text>}

      <TextInput style={[styles.input, styles.multiline]} placeholder="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
      {errors.description && <Text style={styles.error}>{errors.description}</Text>}

      <GooglePlacesAutocomplete
        placeholder="Search address"
        onPress={(data, details) => {
          if (!details) return;
          setAddress(data.description);
          setLat(details.geometry.location.lat);
          setLng(details.geometry.location.lng);
        }}
        query={{ key: PLACES_KEY, language: 'en' }}
        fetchDetails
        styles={{ container: { marginBottom: 12 }, textInput: styles.input }}
      />
      {errors.address && <Text style={styles.error}>{errors.address}</Text>}

      {isEdit && startDate < new Date() ? (
        <View style={[styles.input, { backgroundColor: '#f3f4f6' }]}>
          <Text style={{ color: '#9ca3af' }}>{`Start: ${startDate.toLocaleDateString('en-AU')} (cannot change — sale already started)`}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.input} onPress={() => setShowStartDate(true)}>
          <Text>{`Start: ${startDate.toLocaleDateString('en-AU')}`}</Text>
        </TouchableOpacity>
      )}
      {showStartDate && (
        <DateTimePicker value={startDate} mode="date" minimumDate={new Date()} onChange={(_, d) => { setShowStartDate(false); if (d) setStartDate(d); }} />
      )}
      {errors.startDate && <Text style={styles.error}>{errors.startDate}</Text>}

      <TouchableOpacity style={styles.secondDayToggle} onPress={() => setEndDate(endDate ? null : new Date(startDate.getTime() + 86400000))}>
        <Text style={styles.secondDayText}>{endDate ? '✓ Two-day sale' : '+ Add second day'}</Text>
      </TouchableOpacity>
      {endDate && (
        <>
          <TouchableOpacity style={styles.input} onPress={() => setShowEndDate(true)}>
            <Text>{`End: ${endDate.toLocaleDateString('en-AU')}`}</Text>
          </TouchableOpacity>
          {showEndDate && (
            <DateTimePicker value={endDate} mode="date" minimumDate={new Date(startDate.getTime() + 86400000)} onChange={(_, d) => { setShowEndDate(false); if (d) setEndDate(d); }} />
          )}
        </>
      )}
      {errors.endDate && <Text style={styles.error}>{errors.endDate}</Text>}

      <View style={styles.timeRow}>
        <TouchableOpacity style={[styles.input, { flex: 1 }]} onPress={() => setShowStartTime(true)}>
          <Text>Start: {startTime}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.input, { flex: 1, marginLeft: 8 }]} onPress={() => setShowEndTime(true)}>
          <Text>End: {endTime}</Text>
        </TouchableOpacity>
      </View>
      {showStartTime && (
        <DateTimePicker value={timeStringToDate(startTime)} mode="time" is24Hour onChange={(_, d) => { setShowStartTime(false); if (d) setStartTime(dateToTimeString(d)); }} />
      )}
      {showEndTime && (
        <DateTimePicker value={timeStringToDate(endTime)} mode="time" is24Hour onChange={(_, d) => { setShowEndTime(false); if (d) setEndTime(dateToTimeString(d)); }} />
      )}
      {errors.endTime && <Text style={styles.error}>{errors.endTime}</Text>}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEdit ? 'Save Changes' : 'Add Listing'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  imageRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  imageThumb: { position: 'relative' },
  thumbImg: { width: 80, height: 80, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addImageBtn: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9ca3af', alignItems: 'center', justifyContent: 'center' },
  addImageText: { color: '#6b7280', fontSize: 13 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: '#fff' },
  multiline: { height: 100, textAlignVertical: 'top' },
  timeRow: { flexDirection: 'row' },
  secondDayToggle: { marginBottom: 8 },
  secondDayText: { color: '#2563eb', fontSize: 14 },
  error: { color: '#dc2626', fontSize: 12, marginBottom: 8, marginTop: -4 },
  submitBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
