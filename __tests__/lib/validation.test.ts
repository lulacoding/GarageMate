import { validateListingForm } from '@/lib/validation';

jest.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: (d: Date) => ({ toMillis: () => d.getTime() }),
  },
}));

import { Timestamp } from 'firebase/firestore';

describe('validateListingForm', () => {
  const base = {
    title: 'Sale',
    description: 'Stuff for sale',
    images: ['img1'],
    address: '123 St',
    lat: -37.8,
    lng: 144.9,
    startDate: Timestamp.fromDate(new Date(Date.now() + 86400000)),
    endDate: null,
    startTime: '09:00',
    endTime: '14:00',
  };

  it('returns no errors for valid input', () => {
    expect(validateListingForm(base as any)).toEqual({});
  });

  it('errors when title is empty', () => {
    expect(validateListingForm({ ...base, title: '' } as any).title).toBeTruthy();
  });

  it('errors when no images', () => {
    expect(validateListingForm({ ...base, images: [] } as any).images).toBeTruthy();
  });

  it('errors when start date is in the past', () => {
    const past = Timestamp.fromDate(new Date(Date.now() - 86400000));
    expect(validateListingForm({ ...base, startDate: past } as any).startDate).toBeTruthy();
  });

  it('errors when endTime is before startTime', () => {
    expect(validateListingForm({ ...base, startTime: '14:00', endTime: '09:00' } as any).endTime).toBeTruthy();
  });
});
