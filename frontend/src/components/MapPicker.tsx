import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface MapPickerProps {
  latitude: number;
  longitude: number;
  locationName?: string; // ← nouveau
  onLocationChange?: (lat: number, lng: number) => void;
  onLocationNameChange?: (name: string) => void; // ← nouveau
  zoom?: number;
  height?: string;
  className?: string;
}

function LocationMarkerEventTracker({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition?: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (setPosition) setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position} />;
}

export default function MapPicker({
  latitude,
  longitude,
  locationName = "",
  onLocationChange,
  onLocationNameChange,
  zoom = 10,
  height = "400px",
  className = "",
}: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState(locationName);
  const isEditable = !!onLocationChange;
  const skipReverseRef = useRef(false); // évite boucle infinie

  // Sync le champ de recherche si locationName change depuis l'extérieur
  useEffect(() => {
    setSearchQuery(locationName);
  }, [locationName]);

  // Reverse geocoding : coords → nom
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`,
      );
      const data = await res.json();
      const name =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.suburb ||
        data.display_name?.split(",")[0] ||
        "";
      if (onLocationNameChange) onLocationNameChange(name);
      setSearchQuery(name);
    } catch (err) {
      console.error("Reverse geocoding error", err);
    }
  };

  // Forward geocoding : nom → coords
  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        skipReverseRef.current = true; // on vient du texte, pas besoin de reverse
        if (onLocationChange)
          onLocationChange(parseFloat(data[0].lat), parseFloat(data[0].lon));
        if (onLocationNameChange) onLocationNameChange(searchQuery);
      } else {
        alert("Location not found");
      }
    } catch (err) {
      console.error("Geocoding error", err);
    }
  };

  const handleMarkerMove = (pos: [number, number]) => {
    if (onLocationChange) onLocationChange(pos[0], pos[1]);
    reverseGeocode(pos[0], pos[1]);
  };

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {isEditable && (
        <div className="flex items-center bg-surface-container-low rounded-xl px-4 py-2 border border-outline-variant/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <span className="material-symbols-outlined text-on-surface-variant mr-3">
            search
          </span>
          <input
            type="text"
            placeholder="Search for a location..."
            className="flex-1 bg-transparent border-none text-sm outline-none text-on-surface"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch(e as any);
              }
            }}
          />
          <button
            type="button"
            onClick={handleSearch}
            className="text-primary font-bold text-xs uppercase tracking-widest ml-3 hover:text-primary-container"
          >
            Find
          </button>
        </div>
      )}

      <div
        className="w-full rounded-[2rem] overflow-hidden shadow-inner border border-outline-variant/20 relative z-0"
        style={{ height }}
      >
        <MapContainer
          center={[latitude, longitude]}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <ChangeView center={[latitude, longitude]} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarkerEventTracker
            position={[latitude, longitude]}
            setPosition={isEditable ? handleMarkerMove : undefined}
          />
        </MapContainer>

        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest text-primary shadow-lg border border-primary/20 pointer-events-none flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">
            my_location
          </span>
          <span>LAT: {latitude.toFixed(4)}</span>
          <span className="opacity-30">|</span>
          <span>LNG: {longitude.toFixed(4)}</span>
        </div>
      </div>

      {isEditable && (
        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 font-medium">
          <span className="material-symbols-outlined text-[14px]">
            touch_app
          </span>
          Click on the map to pinpoint the exact location
        </p>
      )}
    </div>
  );
}
