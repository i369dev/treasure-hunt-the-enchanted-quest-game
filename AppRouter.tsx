

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TreasureHuntGame from './pages/TreasureHuntGame';
import Header from './components/Header';
import LocationPermissionModal from './components/LocationPermissionModal';
import TermsAndConditionsModal from './components/TermsAndConditionsModal';

const TERMS_VERSION = '1.0'; // Version for the terms and conditions
const TERMS_ACCEPTED_KEY = `treasure-hunt-terms-accepted-${TERMS_VERSION}`;


const AppRouter: React.FC = () => {
    const { user } = useAuth();
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showInitialTermsModal, setShowInitialTermsModal] = useState(false);
    const [isViewingTerms, setIsViewingTerms] = useState(false);

    useEffect(() => {
        // This check runs on every app launch, after the permission gate.
        navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
            
            const checkServiceAndPrompt = () => {
                // If permission is outright denied by the user, they need to change it in settings.
                // We show an informational modal.
                if (permissionStatus.state === 'denied') {
                    setShowLocationModal(true);
                    return;
                }
                
                // If not denied, we try to get a position.
                // This will fail if the OS-level service is turned off.
                navigator.geolocation.getCurrentPosition(
                    () => {
                       // Success means location services are on. Hide modal if it was somehow shown.
                       setShowLocationModal(false);
                    },
                    (error) => {
                        // Any failure here implies the user can't get a location.
                        // This covers the OS service being off, or the user denying the prompt at this stage.
                        console.warn("Location service check failed:", error.message);
                        setShowLocationModal(true);
                    },
                    { timeout: 8000 }
                );
            }

            checkServiceAndPrompt();
            
            // Listen for changes, e.g., if user enables permissions in another tab.
            permissionStatus.onchange = () => {
               checkServiceAndPrompt();
            };
        });
    }, []); // Empty array means it runs once when the component mounts.

    useEffect(() => {
        if (user) {
            const hasAccepted = localStorage.getItem(TERMS_ACCEPTED_KEY);
            if (!hasAccepted) {
                setShowInitialTermsModal(true);
            }
        } else {
            setShowInitialTermsModal(false); // Reset on logout
        }
    }, [user]);

    const handleAcceptTerms = () => {
        localStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
        setShowInitialTermsModal(false);
    };

    const handleCloseTerms = () => {
        setIsViewingTerms(false);
    };


    if (!user) {
        return (
            <main className="min-h-screen bg-cover bg-center bg-fixed text-white p-4 sm:p-8" style={{backgroundImage: "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop')"}}>
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <LoginPage />
                </div>
            </main>
        );
    }
    
    const pageContent = user.role === 'admin' ? <AdminDashboard /> : <TreasureHuntGame />;
    const showTerms = showInitialTermsModal || isViewingTerms;

    return (
        <main className="min-h-screen bg-cover bg-center bg-fixed text-white p-4 sm:p-8" style={{backgroundImage: "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop')"}}>
            <TermsAndConditionsModal 
                isOpen={showTerms} 
                onAccept={handleAcceptTerms}
                onClose={handleCloseTerms}
                isAcceptanceMode={showInitialTermsModal}
            />
            <LocationPermissionModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div className="relative z-10 flex flex-col items-start justify-start min-h-screen w-full">
                <Header onViewTerms={() => setIsViewingTerms(true)} />
                <div className="w-full flex-grow flex items-stretch justify-center pt-8">
                   {/* Don't render main content until terms are accepted */}
                   {!showInitialTermsModal && pageContent}
                </div>
            </div>
        </main>
    );
};

export default AppRouter;