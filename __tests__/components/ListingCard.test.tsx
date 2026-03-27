import React from 'react';
import { render } from '@testing-library/react-native';
import { ListingCard } from '@/components/ListingCard';

const mockListing = {
  id: '1',
  title: 'Big Garage Sale',
  address: '123 Main St, Melbourne',
  images: ['https://example.com/img1.jpg'],
  startDate: { toDate: () => new Date('2026-04-01'), toMillis: () => 1743465600000 } as any,
  endDate: null,
  startTime: '09:00',
  endTime: '14:00',
  active: true,
} as any;

describe('ListingCard', () => {
  it('renders title and address', () => {
    const { getByText } = render(<ListingCard listing={mockListing} onPress={() => {}} />);
    expect(getByText('Big Garage Sale')).toBeTruthy();
    expect(getByText('123 Main St, Melbourne')).toBeTruthy();
  });
});
