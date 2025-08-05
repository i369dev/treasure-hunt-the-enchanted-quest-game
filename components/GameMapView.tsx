import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { playerIcon } from './PlayerMarker';
import LoadingSpinner from './LoadingSpinner';
import { QuestState } from '../types';
import { createNumberedTaskIcon, finalTaskIcon } from './TaskMarkerIcons';

interface GameMapViewProps {
    isOpen: boolean;
    onClose: () => void;
    questState: QuestState | null;
}

interface TaskMarkerData {
    id: string;
    position: L.LatLngTuple;
    taskNumber: number;
    taskTitle: string;
    isFinal: boolean;
}

// --- ICONS ---
const CloseIcon = ({ className = "h-7 w-7" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- TILE LAYER CONFIG ---
const TILE_LAYER_SATELLITE = {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
};

const InvalidateSize: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

const RecenterButton: React.FC<{position: L.LatLngTuple | null}> = ({ position }) => {
    const map = useMap();
    const recenter = () => {
        if(position){
            map.flyTo(position, map.getZoom() || 15);
        }
    };
    if (!position) return null;
    return (
        <button 
            onClick={recenter} 
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
            aria-label="Center map on my location"
        >
            Center on Me
        </button>
    );
};

const GameMapView: React.FC<GameMapViewProps> = ({ isOpen, onClose, questState }) => {
    const [position, setPosition] = useState<L.LatLngTuple | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isLoadingPosition, setIsLoadingPosition] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [taskMarkers, setTaskMarkers] = useState<TaskMarkerData[]>([]);
    const hasLoadedPosition = useRef(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        setIsLoadingPosition(true);
        hasLoadedPosition.current = false;
        setPosition(null);
        setError(null);

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos: L.LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
                setPosition(newPos);
                if (!hasLoadedPosition.current) {
                    setIsLoadingPosition(false);
                    hasLoadedPosition.current = true;
                }
            },
            (err) => {
                console.warn(`Could not get location: ${err.message}`);
                setError("Could not pinpoint your location. Please ensure location services are enabled and you have a clear signal.");
                setIsLoadingPosition(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !questState) {
            setTaskMarkers([]);
            return;
        }

        const markers: TaskMarkerData[] = [];
        
        questState.quest.tasks.forEach((task, index) => {
            if (task.isCompleted && task.completionLocation) {
                const isFinalTask = index === questState.quest.tasks.length - 1;
                 markers.push({
                    id: task.id,
                    position: [task.completionLocation.latitude, task.completionLocation.longitude],
                    taskNumber: index + 1,
                    taskTitle: task.title,
                    isFinal: isFinalTask,
                });
            }
        });
        
        setTaskMarkers(markers);
    }, [isOpen, questState]);

    if (!isOpen) return null;

    const renderMapContent = () => {
        if (isLoadingPosition) {
            return (
                <div className="absolute inset-0 z-[1001] bg-gray-800/80 flex flex-col items-center justify-center text-center p-4">
                    <LoadingSpinner />
                    <p className="font-cinzel text-xl text-yellow-300 mt-4">Finding your position...</p>
                </div>
            );
        }

        if (error && !position) { // Only show full error screen if we have no position at all
            return (
                <div className="absolute inset-0 z-[1001] bg-gray-800/80 flex flex-col items-center justify-center text-center p-4">
                    <h3 className="font-cinzel text-2xl text-red-400">Location Error</h3>
                    <p className="text-white mt-2">{error}</p>
                </div>
            );
        }
        
        return (
            <MapContainer 
                center={position || [37.77, -122.41]} // Default center if position is somehow null
                zoom={15}
                scrollWheelZoom={true} 
                zoomControl={false} // Disable default zoom to use custom styled ones
                style={{ height: '100%', width: '100%' }}
            >
                <InvalidateSize />
                <TileLayer
                    attribution={TILE_LAYER_SATELLITE.attribution}
                    url={TILE_LAYER_SATELLITE.url}
                />
                 {/* Re-add zoom controls in the new position via react-leaflet's component API */}
                <ZoomControl position="bottomleft" />
                {position && (
                    <Marker position={position} icon={playerIcon}>
                        <Popup>You are here. <br/> The forest watches.</Popup>
                    </Marker>
                )}
                {taskMarkers.map(marker => (
                    <Marker 
                        key={marker.id} 
                        position={marker.position} 
                        icon={marker.isFinal ? finalTaskIcon : createNumberedTaskIcon(marker.taskNumber)}
                    >
                        <Popup>
                            <div className="font-sans">
                                <strong className="text-base text-yellow-300">Task {marker.taskNumber}: {marker.taskTitle}</strong>
                                <p className="text-sm text-gray-200">Completed here!</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
                <RecenterButton position={position} />
            </MapContainer>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" role="dialog" aria-modal="true">
            <div
                className="relative w-screen h-screen bg-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Floating Controls (increased z-index) */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-[1002] bg-black/50 backdrop-blur-sm text-white rounded-full h-12 w-12 flex items-center justify-center transition-colors hover:bg-red-700/80 shadow-lg" 
                    aria-label="Close Map"
                >
                    <CloseIcon />
                </button>
                
                {/* Map Content Area */}
                <div className="absolute inset-0">
                    {!isOnline && (
                        <div className="absolute inset-0 z-[1001] bg-black/70 flex flex-col items-center justify-center text-center p-4">
                            <h3 className="font-cinzel text-2xl text-red-400">Map Unavailable</h3>
                            <p className="text-white mt-2">Please check your internet connection.</p>
                        </div>
                    )}
                    
                    {renderMapContent()}
                </div>
            </div>
        </div>
    );
};

export default GameMapView;