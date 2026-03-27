import MapView, { Marker, Region } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { Listing, LocationCoords } from '@/types';

interface Props {
  center: LocationCoords;
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
}

export function MapNative({ center, listings, onSelectListing }: Props) {
  const region: Region = {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: 0.3,
    longitudeDelta: 0.3,
  };

  return (
    <MapView style={styles.map} initialRegion={region} showsUserLocation>
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          coordinate={{ latitude: listing.lat, longitude: listing.lng }}
          title={listing.title}
          onPress={() => onSelectListing(listing)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
