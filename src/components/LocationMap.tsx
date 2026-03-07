import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search } from 'lucide-react';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Props {
    onLocationSelect: (lat: number, lng: number) => void;
    pickupPoints?: any[];
}

// Utility to force map resize after mounting (fixes grey tiles issue in modals)
function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const timeout = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timeout);
    }, [map]);
    return null;
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null);

    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    // Auto-locate only if we don't have a better center set by pickup points
    // (This prevents the map from flying away from Barquisimeto if the user's IP is far away)
    // useEffect(() => {
    //    map.locate();
    // }, [map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export default function LocationMap({ onLocationSelect, pickupPoints = [] }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const mapRef = useRef<L.Map>(null);

    const defaultCenter: [number, number] = [10.0645, -69.3496]; // Default to Barquisimeto

    // Calculate center dynamically based on pickup points
    const center: [number, number] = pickupPoints.length > 0
        ? [
            pickupPoints.reduce((acc, point) => acc + (point.coords?.lat || 0), 0) / pickupPoints.length,
            pickupPoints.reduce((acc, point) => acc + (point.coords?.lng || 0), 0) / pickupPoints.length
        ]
        : defaultCenter;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !mapRef.current) return;

        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ", Venezuela")}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                mapRef.current.flyTo([lat, lon], 14);
            }
        } catch (error) {
            console.error("Error searching location:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-2 relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-sm">
                <form onSubmit={handleSearch} className="flex items-center bg-white rounded-full shadow-md overflow-hidden border-2 border-[#F2A900]">
                    <div className="pl-3 text-gray-400">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar ciudad o zona..."
                        className="w-full text-xs py-2 px-2 focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="bg-[#D91A2A] text-white px-3 py-2 text-xs font-bold disabled:opacity-50 hover:bg-[#B71524] transition-colors"
                    >
                        {isSearching ? '...' : 'IR'}
                    </button>
                </form>
            </div>
            <div className="flex-1 w-full rounded-lg overflow-hidden border-2 border-[#F2A900] relative">
                <MapContainer
                    center={center}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                    ref={mapRef}
                >
                    <MapResizer />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker onLocationSelect={onLocationSelect} />
                </MapContainer>
            </div>
        </div>
    );
}
