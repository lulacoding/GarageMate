import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Listing, LocationCoords } from '@/types';

// Fix default marker icon missing in webpack builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  center: LocationCoords;
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
}

function RecenterMap({ center }: { center: LocationCoords }) {
  const map = useMap();
  useEffect(() => { map.setView([center.lat, center.lng]); }, [center.lat, center.lng]);
  return null;
}

export function MapWeb({ center, listings, onSelectListing }: Props) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          eventHandlers={{ click: () => onSelectListing(listing) }}
        >
          <Popup>{listing.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
