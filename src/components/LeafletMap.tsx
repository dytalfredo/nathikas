import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search } from 'lucide-react';

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map view updates
function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    map.setView(center, map.getZoom());
    return null;
}

export default function LeafletMap() {
    const [center, setCenter] = useState<[number, number]>([10.4806, -66.9036]); // Caracas default
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;

        setIsLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setCenter([parseFloat(lat), parseFloat(lon)]);
            } else {
                alert('No se encontraron resultados');
            }
        } catch (error) {
            console.error('Error searching location:', error);
            alert('Error al buscar la ubicación');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-md border-2 border-gray-200 z-0">
            {/* Search Bar - Floating inside map */}
            <div className="absolute top-2 left-2 right-2 z-[1000]">
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar ciudad o zona..."
                        className="w-full pl-10 pr-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-300 focus:outline-none focus:border-[#F2A900] text-sm"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                    <button type="submit" className="hidden" disabled={isLoading}>Buscar</button>
                    {isLoading && (
                        <div className="absolute right-3 top-2.5 w-4 h-4 rounded-full border-2 border-[#D91A2A] border-t-transparent animate-spin"></div>
                    )}
                </form>
            </div>

            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={false}
                className="w-full h-full"
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={center} draggable={true}>
                </Marker>
                <ChangeView center={center} />
            </MapContainer>
        </div>
    );
}
