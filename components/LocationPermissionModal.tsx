
import React, { useEffect } from 'react';

interface LocationPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ isOpen, onClose }) => {
    // Effect to prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-black/50 border border-yellow-300/30 rounded-2xl p-6 sm:p-8 max-w-lg shadow-2xl text-center text-white">
                <h2 className="font-cinzel text-3xl text-yellow-300 mb-4">Location Services Required</h2>
                <p className="text-gray-200 mb-6 text-lg">
                    This treasure hunt requires access to your location for geotagging photos and for future map-based challenges.
                </p>
                <p className="text-gray-300 mb-8">
                    Please enable location services in your device's settings to continue.
                </p>
                <button
                    onClick={onClose}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-lg py-2 px-8 rounded-lg transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                    I Understand
                </button>
            </div>
        </div>
    );
};

export default LocationPermissionModal;
