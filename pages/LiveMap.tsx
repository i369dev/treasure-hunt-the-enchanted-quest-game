

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getAllUsersLocations } from '../services/locationService';
import { UserLocation } from '../types';
import { createUserLiveIcon } from '../components/UserLiveMarker';
import LoadingSpinner from '../components/LoadingSpinner';

const mapContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: '#192631',
};

const InvalidateSize: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};


const LiveMap: React.FC = () => {
    const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const pollingIntervalRef = useRef<number | null>(null);
    
    const fetchLocations = () => {
        const locations = getAllUsersLocations();
        setUserLocations(locations);
        setLastUpdated(new Date());
        if(isLoading) setIsLoading(false);
    };

    useEffect(() => {
        fetchLocations(); // Initial fetch
        pollingIntervalRef.current = window.setInterval(fetchLocations, 7000); // Poll every 7 seconds

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [isLoading]); 

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-yellow-300/20">
                <LoadingSpinner />
                <p className="mt-4 font-cinzel text-xl text-yellow-300">Summoning the Fleet View...</p>
            </div>
        );
    }
    
    const bounds = userLocations.length > 0
        ? L.latLngBounds(userLocations.map(u => [u.latitude, u.longitude]))
        : undefined;

    const activeUserCount = userLocations.filter(u => u.status === 'active').length;
    const offlineUserCount = userLocations.length - activeUserCount;

    return (
        <div className="w-full h-full bg-black/40 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-yellow-300/20 flex flex-col">
            <div className="flex justify-between items-center mb-2 px-2 flex-shrink-0">
                <h2 className="font-cinzel text-2xl text-yellow-300">Fleet View</h2>
                 <p className="text-xs text-gray-400">
                    <span className="text-green-400 font-bold">{activeUserCount} Active</span> | 
                    <span className="text-gray-500 font-bold"> {offlineUserCount} Offline</span> | 
                    Last update: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
                </p>
            </div>
            <div className="flex-grow w-full relative">
                {userLocations.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 font-cinzel text-xl">
                        Awaiting signals from adventurers...
                    </div>
                ) : (
                    <MapContainer
                        center={bounds ? bounds.getCenter() : [37.8651, -119.5383]}
                        bounds={bounds}
                        boundsOptions={{ padding: [50, 50] }}
                        zoom={8}
                        scrollWheelZoom={true}
                        style={mapContainerStyle}
                        className="rounded-lg"
                    >
                        <InvalidateSize />
                        <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                        {userLocations.map(user => (
                            <Marker
                                key={user.username}
                                position={[user.latitude, user.longitude]}
                                icon={createUserLiveIcon(user)}
                            >
                                <Popup>
                                    <div className="font-sans">
                                        <strong className="text-base text-yellow-300">{user.firstName} {user.lastName}</strong>
                                        <p className="text-sm text-gray-200">@{user.username}</p>
                                        <p className={`text-xs mt-2 font-bold ${user.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>
                                            Status: {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Last seen: {new Date(user.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}
            </div>
        </div>
    );
};

export default LiveMap;