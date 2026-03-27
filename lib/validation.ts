import { Timestamp } from 'firebase/firestore';

interface FormValues {
  title: string;
  description: string;
  images: string[];
  address: string;
  lat?: number;
  lng?: number;
  startDate: Timestamp;
  endDate: Timestamp | null;
  startTime: string;
  endTime: string;
}

export function validateListingForm(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.title.trim()) errors.title = 'Title is required.';
  if (values.title.length > 100) errors.title = 'Title must be under 100 characters.';
  if (!values.description.trim()) errors.description = 'Description is required.';
  if (values.description.length > 500) errors.description = 'Description must be under 500 characters.';
  if (values.images.length === 0) errors.images = 'At least one image is required.';
  if (!values.address || !values.lat || !values.lng) errors.address = 'Select an address from the suggestions.';
  if (values.startDate.toMillis() < Date.now()) errors.startDate = 'Start date must not be in the past.';
  if (values.endDate && values.endDate.toMillis() <= values.startDate.toMillis()) {
    errors.endDate = 'Second day must be after the first day.';
  }
  const [startH, startM] = values.startTime.split(':').map(Number);
  const [endH, endM] = values.endTime.split(':').map(Number);
  if (endH * 60 + endM <= startH * 60 + startM) errors.endTime = 'End time must be after start time.';
  return errors;
}
