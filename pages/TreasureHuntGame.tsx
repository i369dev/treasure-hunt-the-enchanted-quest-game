
import React, { useState, useEffect, useCallback } from 'react';
import { QuestState, User, Task, SubTask, UserAsset, UnlockNotification } from '../types';
import { getQuestState, saveQuestState, createNewQuestState, resetQuestState } from '../services/questService';
import { saveUserAsset, getUserAssets } from '../services/assetService';
import { sendSOSAlert } from '../services/sosService';
import { addUnlockRequest } from '../services/unlockRequestService';
import QuestMap from '../components/QuestMap';
import TaskCard from '../components/TaskCard';
import LoadingSpinner from '../components/LoadingSpinner';
import QuestCompletion from '../components/QuestCompletion';
import ActivityDashboard from '../components/ActivityDashboard';
import GameMapView from '../components/GameMapView';
import { useAuth } from '../context/AuthContext';
import { audioService } from '../services/audioService';

const MapIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
        <line x1="8" y1="2" x2="8" y2="18"></line>
        <line x1="16" y1="6" x2="16" y2="22"></line>
    </svg>
);

const SOSIcon: React.FC = () => (
    // A simple text-based icon for maximum clarity. The parent button provides the color and shape.
     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 32 32" fill="white">
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="'Lato', sans-serif">
            SOS
        </text>
    </svg>
);

const SOSModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User;
}> = ({ isOpen, onClose, user }) => {
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStatus('idle');
            setErrorMessage('');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        setStatus('sending');
        setErrorMessage('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                sendSOSAlert(user, position.coords);
                setStatus('sent');
            },
            (err) => {
                setErrorMessage(`Could not get location: ${err.message}. Please ensure location services are enabled.`);
                setStatus('error');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };
    
    if (!isOpen) return null;

    const renderContent = () => {
        switch (status) {
            case 'sending':
                return (
                    <>
                        <h2 className="font-cinzel text-3xl text-yellow-300 mb-4">Sending Alert...</h2>
                        <LoadingSpinner />
                        <p className="text-gray-200 mt-4">Getting your precise location...</p>
                    </>
                );
            case 'sent':
                return (
                    <>
                        <h2 className="font-cinzel text-3xl text-green-400 mb-4">Alert Sent!</h2>
                        <p className="text-gray-200 mb-8 text-lg">Help is on the way. The administrators have been notified of your location. Stay put if possible.</p>
                        <button onClick={onClose} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-lg py-2 px-8 rounded-lg">Close</button>
                    </>
                );
            case 'error':
                 return (
                    <>
                        <h2 className="font-cinzel text-3xl text-red-400 mb-4">Alert Failed</h2>
                        <p className="text-gray-200 mb-8 text-lg">{errorMessage}</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-md text-lg">Cancel</button>
                            <button onClick={handleConfirm} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-md text-lg">Try Again</button>
                        </div>
                    </>
                );
            case 'idle':
            default:
                return (
                    <>
                        <h2 className="font-cinzel text-3xl text-red-400 mb-4">Confirm SOS Alert</h2>
                        <p className="text-gray-200 mb-6 text-lg">Are you sure you want to send an emergency alert to the administrators?</p>
                        <p className="text-gray-300 mb-8">This will immediately send your current location and signal that you need help.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-md text-lg">Cancel</button>
                            <button onClick={handleConfirm} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-md text-lg">Yes, I Need Help</button>
                        </div>
                    </>
                );
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={status === 'idle' ? onClose : undefined}>
            <div className="bg-black/50 border border-yellow-300/30 rounded-2xl p-6 sm:p-8 max-w-lg shadow-2xl text-center text-white" onClick={e => e.stopPropagation()}>
                {renderContent()}
            </div>
        </div>
    );
};

const UnlockRequestModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User;
    item: { task: Task; subtask: SubTask } | null;
}> = ({ isOpen, onClose, user, item }) => {
    const [reason, setReason] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    useEffect(() => {
        if (isOpen) {
            setStatus('idle');
            setReason('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!item) return;
        setStatus('sending');
        try {
            addUnlockRequest({
                userId: user.username,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                taskId: item.task.id,
                taskTitle: item.task.title,
                subtaskId: item.subtask.id,
                subtaskDescription: item.subtask.description,
                reason: reason,
            });
            setStatus('sent');
        } catch (e) {
            console.error('Failed to send unlock request', e);
            setStatus('error');
        }
    };
    
    if (!isOpen || !item) return null;

     const renderContent = () => {
        switch (status) {
            case 'sending':
                return <><h2 className="font-cinzel text-3xl text-yellow-300 mb-4">Sending Request...</h2><LoadingSpinner /></>;
            case 'sent':
                return <>
                    <h2 className="font-cinzel text-3xl text-green-400 mb-4">Request Sent</h2>
                    <p className="text-gray-200 mb-8 text-lg">The administrators have been notified. They will review your request shortly.</p>
                    <button onClick={onClose} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-lg py-2 px-8 rounded-lg">Close</button>
                </>;
            case 'error':
                 return <>
                    <h2 className="font-cinzel text-3xl text-red-400 mb-4">Request Failed</h2>
                    <p className="text-gray-200 mb-8 text-lg">Could not send the request. Please try again later.</p>
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-md text-lg">Close</button>
                </>;
            case 'idle':
            default:
                return <>
                    <h2 className="font-cinzel text-3xl text-yellow-300 mb-2">Request Unlock</h2>
                    <p className="text-gray-300 mb-4">You are requesting help for the sub-task:</p>
                    <p className="text-lg font-semibold text-yellow-200 bg-black/20 p-2 rounded-md mb-6">{item.subtask.description}</p>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Please explain why you need help (e.g., 'I'm stuck', 'The object is missing', etc.)" rows={4} className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-white focus:ring-yellow-400 focus:border-yellow-400 transition mb-6"/>
                    <div className="flex justify-center gap-4">
                        <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-md text-lg">Cancel</button>
                        <button onClick={handleSubmit} disabled={!reason.trim()} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-md text-lg disabled:bg-gray-500 disabled:cursor-not-allowed">Submit Request</button>
                    </div>
                </>;
        }
    }
     return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={status === 'idle' ? onClose : undefined}>
            <div className="bg-black/50 border border-yellow-300/30 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center text-white" onClick={e => e.stopPropagation()}>
                {renderContent()}
            </div>
        </div>
    );
};


const TreasureHuntGame: React.FC = () => {
    const { user } = useAuth();
    const [questState, setQuestState] = useState<QuestState | null>(null);
    const [assets, setAssets] = useState<UserAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [isSOSModalOpen, setSOSModalOpen] = useState(false);
    const [unlockRequestItem, setUnlockRequestItem] = useState<{ task: Task; subtask: SubTask } | null>(null);

    const loadQuest = useCallback(() => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            let state = getQuestState(user.username);
            if (!state) {
                state = createNewQuestState(user.username);
            }
            setQuestState(state);
            setAssets(getUserAssets(user.username)); // Load assets with the quest
        } catch (err) {
            console.error(err);
            setError('Failed to conjure the enchanted quest. The forest spirits may be busy. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadQuest();
    }, [loadQuest]);

    const updateQuestState = ( newState: Partial<QuestState>) => {
        if(!user) return;

        setQuestState(prevState => {
            if (!prevState) return null;
            const updatedState = { ...prevState, ...newState };
            saveQuestState(user.username, updatedState);
            return updatedState;
        });
    };

    const handleCompleteSubtask = (
        taskId: string, 
        subtaskId: string, 
        data: boolean | 'skipped' | { imageDataUrl: string; location: GeolocationCoordinates | null; }
    ) => {
        if (!questState || !user) return;

        // --- Sound Effect Logic ---
        const task = questState.quest.tasks.find(t => t.id === taskId);
        const subtask = task?.subTasks.find(st => st.id === subtaskId);
        const wasCompleted = subtask?.isCompleted ?? false;
        const isNowCompleted = data !== false;

        if (!wasCompleted && isNowCompleted) {
            audioService.playSubtaskCompleteSound();
        }
        // --- End Sound Effect Logic ---

        // Handle saving photo asset
        if (data && typeof data === 'object' && data.imageDataUrl) {
            const newAsset: UserAsset = {
                id: `asset-${user.username}-${subtaskId}-${Date.now()}`,
                userId: user.username,
                taskId,
                subtaskId,
                timestamp: Date.now(),
                imageDataUrl: data.imageDataUrl,
                location: data.location ? {
                    latitude: data.location.latitude,
                    longitude: data.location.longitude,
                } : null,
            };
            saveUserAsset(newAsset);
            // Update assets state immediately to reflect changes on map
            if (newAsset.location) {
                setAssets(prevAssets => [...prevAssets, newAsset]);
            }
        }

        const isCompleted = data !== false; // Mark complete for true, 'skipped', or a photo object

        const newTasks = questState.quest.tasks.map(task => {
            if (task.id === taskId) {
                const newSubtasks = task.subTasks.map(subtask => {
                    if (subtask.id === subtaskId) {
                        return { ...subtask, isCompleted };
                    }
                    return subtask;
                });
                return { ...task, subTasks: newSubtasks };
            }
            return task;
        });

        const newQuest = { ...questState.quest, tasks: newTasks };
        updateQuestState({ quest: newQuest });
    };
    
    const handleCompleteTask = () => {
        if (!questState || !user) return;

        const completeTaskWithLocation = (location: GeolocationCoordinates | null) => {
            if (!questState) return; // Re-check state inside callback

            const locationData = location ? { latitude: location.latitude, longitude: location.longitude } : null;

            const newTasks = questState.quest.tasks.map((task, index) => {
                if (index === questState.currentTaskIndex) {
                    return { ...task, isCompleted: true, completionLocation: locationData };
                }
                return task;
            });
            
            const newQuest = { ...questState.quest, tasks: newTasks };
            const nextTaskIndex = questState.currentTaskIndex + 1;

            updateQuestState({ quest: newQuest, currentTaskIndex: nextTaskIndex });
            audioService.playTaskCompleteSound();
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                completeTaskWithLocation(position.coords);
            },
            (error) => {
                console.warn("Could not get location for task completion:", error.message);
                // Complete task anyway, but without location data.
                completeTaskWithLocation(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };
    
    const handleRestart = () => {
        if (!user) return;
        setQuestState(null);
        resetQuestState(user.username); // This now also resets activity data
        loadQuest();
    };

    const handleRequestUnlock = (task: Task, subtask: SubTask) => {
        setUnlockRequestItem({ task, subtask });
    };

    const handleDismissNotification = (notificationId: string) => {
        if (!questState || !user) return;
        const updatedNotifications = questState.notifications?.filter(n => n.id !== notificationId) || [];
        updateQuestState({ notifications: updatedNotifications });
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center text-white">
                    <LoadingSpinner />
                    <p className="mt-4 text-xl font-cinzel">Summoning Your Quest...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-red-300 bg-red-900/50 p-8 rounded-lg shadow-lg">
                    <p className="font-cinzel text-2xl mb-4">An Error Occurred</p>
                    <p>{error}</p>
                     <button
                        onClick={handleRestart}
                        className="mt-6 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        if (questState) {
             if (questState.currentTaskIndex >= questState.quest.tasks.length) {
                return <QuestCompletion questTitle={questState.quest.title} onRestart={handleRestart} />;
            }
            
            const currentTask = questState.quest.tasks[questState.currentTaskIndex];
            return (
                <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 flex flex-col gap-y-8">
                        <QuestMap tasks={questState.quest.tasks} currentTaskIndex={questState.currentTaskIndex} />
                        <ActivityDashboard />
                    </div>
                    <div className="lg:col-span-2">
                        <TaskCard 
                            task={currentTask} 
                            onCompleteSubtask={handleCompleteSubtask}
                            onCompleteTask={handleCompleteTask}
                            onRequestUnlock={handleRequestUnlock}
                            notifications={questState.notifications}
                            onDismissNotification={handleDismissNotification}
                        />
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="w-full flex-grow flex items-center justify-center">
            {renderContent()}

            {/* Floating Action Buttons */}
            <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
                 <button
                    onClick={() => setSOSModalOpen(true)}
                    className="bg-red-600 hover:bg-red-500 text-white w-16 h-16 flex items-center justify-center p-4 rounded-full shadow-lg transform transition-transform hover:scale-110 animate-fade-in"
                    title="SOS Alert"
                    aria-label="Send SOS Alert"
                >
                    <SOSIcon />
                </button>
                <button
                    onClick={() => setIsMapOpen(true)}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black w-16 h-16 flex items-center justify-center p-4 rounded-full shadow-lg transform transition-transform hover:scale-110 animate-fade-in"
                    title="Open World Map"
                    aria-label="Open World Map"
                >
                    <MapIcon />
                </button>
            </div>
            
            <GameMapView 
                isOpen={isMapOpen} 
                onClose={() => setIsMapOpen(false)}
                questState={questState}
            />
            {user && <SOSModal isOpen={isSOSModalOpen} onClose={() => setSOSModalOpen(false)} user={user} />}
            {user && <UnlockRequestModal isOpen={!!unlockRequestItem} onClose={() => setUnlockRequestItem(null)} user={user} item={unlockRequestItem}/>}
        </div>
    );
};

export default TreasureHuntGame;