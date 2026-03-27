import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { MapNative } from '@/components/MapNative';

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMap = ({ children }: any) => <View testID="map-view">{children}</View>;
  const MockMarker = () => null;
  return { __esModule: true, default: MockMap, Marker: MockMarker };
});

describe('MapNative', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(
      <MapNative
        center={{ lat: -37.8136, lng: 144.9631 }}
        listings={[]}
        onSelectListing={() => {}}
      />
    );
    expect(getByTestId('map-view')).toBeTruthy();
  });
});
