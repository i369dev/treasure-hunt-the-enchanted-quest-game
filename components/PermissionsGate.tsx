
import React, { useState, useEffect, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

const PERMISSIONS_REQUESTED_KEY = 'treasure-hunt-permissions-requested';

const CameraIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const LocationIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const PermissionsGate: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<'checking' | 'gate' | 'ready'>('checking');

    // Effect to prevent background scrolling when permission gate is shown
    useEffect(() => {
        if (status === 'gate') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [status]);

    useEffect(() => {
        const permissionsRequested = localStorage.getItem(PERMISSIONS_REQUESTED_KEY);
        if (permissionsRequested) {
            setStatus('ready');
        } else {
            setStatus('gate');
        }
    }, []);

    const handleGrantPermissions = async () => {
        // Request Camera Access
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // We don't need to keep the stream, just get permission.
                stream.getTracks().forEach(track => track.stop());
            }
        } catch (err: any) {
            console.warn("Camera permission request failed:", err.message);
            // Don't block app if user denies permission
        }

        // Request Location Access
        try {
            if (navigator.geolocation) {
                await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                });
            }
        } catch (err: any) {
            console.warn("Location permission request failed:", err.message);
             // Don't block app if user denies permission
        }

        // Mark that we've asked for permissions and proceed.
        localStorage.setItem(PERMISSIONS_REQUESTED_KEY, 'true');
        setStatus('ready');
    };
    
    if (status === 'checking') {
        return (
             <div className="min-h-screen bg-cover bg-center bg-fixed text-white" style={{backgroundImage: "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop')"}}>
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md"></div>
                 <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <LoadingSpinner />
                 </div>
            </div>
        );
    }

    if (status === 'gate') {
        return (
            <div className="min-h-screen bg-cover bg-center bg-fixed text-white" style={{backgroundImage: "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop')"}}>
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md"></div>
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center animate-fade-in">
                    <h1 className="text-4xl sm:text-5xl font-cinzel font-bold text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-6">Welcome, Adventurer!</h1>
                    <div className="bg-black/50 border border-yellow-300/30 rounded-2xl p-6 sm:p-8 mb-8 max-w-lg shadow-2xl">
                         <p className="text-yellow-100/80 mb-6 text-lg">This app uses the following browser features:</p>
                         <ul className="space-y-4 text-left text-lg">
                            <li className="flex items-center gap-4">
                                <CameraIcon />
                                <span>Camera for photo tasks</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <LocationIcon />
                                <span>Location to geotag photos</span>
                            </li>
                         </ul>
                         <p className="text-sm text-gray-400 mt-6">Your browser will ask you to approve these permissions. This enhances the quest experience.</p>
                    </div>
                    <button
                        onClick={handleGrantPermissions}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xl py-3 px-12 rounded-lg transition-all duration-300 shadow-lg transform hover:scale-105"
                    >
                        Continue
                    </button>
                </div>
            </div>
        );
    }
    
    return <>{children}</>;
};

export default PermissionsGate;
