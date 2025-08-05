

import React, { useState, useEffect } from 'react';

interface TermsAndConditionsModalProps {
    isOpen: boolean;
    onAccept: () => void;
    onClose: () => void;
    isAcceptanceMode: boolean;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ isOpen, onAccept, onClose, isAcceptanceMode }) => {
    const [view, setView] = useState<'summary' | 'full'>('summary');

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setView('summary'); // Reset to summary view whenever it opens
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const ActionButton: React.FC<{className?: string}> = ({ className }) => {
        if (isAcceptanceMode) {
            return (
                <button
                    onClick={onAccept}
                    className={`bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-lg py-3 px-12 rounded-lg transition-all duration-300 shadow-lg transform hover:scale-105 ${className}`}
                >
                    I Agree
                </button>
            );
        }
        return (
            <button
                onClick={onClose}
                className={`bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-lg py-3 px-12 rounded-lg transition-all duration-300 shadow-lg ${className}`}
            >
                Close
            </button>
        );
    };

    const summaryContent = (
        <>
            <h2 className="font-cinzel text-3xl text-yellow-300 mb-4">Assumption of Risk &amp; Acceptance of Terms</h2>
            <div className="text-gray-300 space-y-4 mb-6 text-left">
                <p>
                    This is a real-world, physically demanding adventure game played entirely outdoors. By clicking "I Agree," you acknowledge and accept that you are participating at your own sole risk.
                </p>
                <p>
                    You are responsible for your own safety at all times, including but not limited to, risks associated with varied terrains (mountains, railway lines, forests, roads), encounters with wildlife, camping, hiking, and pre-existing health conditions.
                </p>
                <p>
                    This application is provided "as-is," and technical faults may occur.
                </p>
            </div>
            
            <button
                onClick={() => setView('full')}
                className="text-yellow-400 hover:text-yellow-300 underline my-4"
            >
                View Full Terms and Conditions
            </button>
            
            <div className="mt-4">
                 <ActionButton />
            </div>
        </>
    );
    
    const fullTermsContent = (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-cinzel text-3xl text-yellow-300">Terms and Conditions of Service</h2>
                <button onClick={() => setView('summary')} className="text-sm bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-md">Back to Summary</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4 text-gray-300 text-left">
                <h3 className="font-bold text-lg text-white">1. Acceptance of Terms</h3>
                <p>By accessing or using this application ("the Service"), you agree to be bound by these Terms and Conditions ("Terms") and our Privacy Policy. If you disagree with any part of the terms, you may not access the Service.</p>
                
                <h3 className="font-bold text-lg text-white">2. Description of Service</h3>
                <p>The Service is a location-based adventure game that requires users to travel physically to various locations. Activities include, but are not limited to, walking, hiking, cycling, and camping through diverse environments such as mountains, forests, railway lines, villages, public places, and main roads.</p>
                
                <h3 className="font-bold text-lg text-white">3. Assumption of Risk and Waiver of Liability</h3>
                <p>You explicitly acknowledge and agree that your participation in the Service is a voluntary activity undertaken at your own risk. You are solely responsible for your safety and wellbeing. The creators of this Service shall not be liable for any personal injury, death, property damage, or other harm you may suffer. This includes, but is not limited to, risks arising from:</p>
                <ul className="list-disc list-inside ml-4">
                    <li>Terrain and Environment: Slips, trips, falls, and other accidents on any terrain.</li>
                    <li>Wildlife: Encounters with any and all animals.</li>
                    <li>Water Bodies: Risks associated with proximity to rivers, lakes, or other bodies of water.</li>
                    <li>Traffic and Public Spaces: Adherence to all local traffic laws and regulations is your responsibility.</li>
                    <li>Camping and Hiking: All inherent risks associated with outdoor recreational activities.</li>
                </ul>

                <h3 className="font-bold text-lg text-white">4. Health and Fitness</h3>
                <p>You affirm that you are physically fit to participate in such activities. If you have any pre-existing medical conditions (e.g., cardiovascular diseases, respiratory issues, etc.) that may be exacerbated by physical exertion, you must consult a physician before playing and/or notify the game team. By playing, you assume all risks associated with your medical condition.</p>
                
                <h3 className="font-bold text-lg text-white">5. User Conduct</h3>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside ml-4">
                    <li>Trespass on private property.</li>
                    <li>Violate any local, state, or national laws.</li>
                    <li>Engage in any activity that may endanger yourself or others.</li>
                </ul>
                
                <h3 className="font-bold text-lg text-white">6. Software Disclaimer</h3>
                <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not warrant that the service will be uninterrupted, secure, or free from errors or technical faults. You agree to report any such issues to the game team for review.</p>
                
                <h3 className="font-bold text-lg text-white">7. Data and Privacy</h3>
                <p>Our Privacy Policy, which is incorporated into these Terms by reference, explains how we collect and use your data (including location data).</p>
                
                <h3 className="font-bold text-lg text-white">8. Indemnification</h3>
                <p>You agree to indemnify and hold harmless the company, its employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your access to or use of the Service.</p>
            </div>
             <ActionButton className="mt-8" />
        </>
    );

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-black/50 border-2 border-yellow-400/50 rounded-2xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl text-center text-white relative">
                {!isAcceptanceMode && (
                    <button onClick={onClose} className="absolute top-3 right-3 text-white/60 hover:text-white/90 text-4xl font-light z-10" aria-label="Close">&times;</button>
                )}
                {view === 'summary' ? summaryContent : fullTermsContent}
            </div>
        </div>
    );
};
export default TermsAndConditionsModal;