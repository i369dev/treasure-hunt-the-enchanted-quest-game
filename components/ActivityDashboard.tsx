
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActivityData } from '../types';
import { getActivityData, saveActivityData } from '../services/activityService';
import { saveUserLocation } from '../services/locationService';
import { calculateBMR } from '../services/healthService';

// Haversine formula to calculate distance between two lat/lon points
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

// Helper to format seconds into HH:MM:SS
const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// --- Thematic Icons ---

const FootprintsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20C4 17 6 15 8 15s4 2 4 5" />
        <path d="M12 20c0-3.5 2-5 4-5s4 1.5 4 5" />
        <path d="M4 11c0-3.5 2-5 4-5s4 1.5 4 5" />
        <path d="M12 11c0-3.5 2-5 4-5s4 1.5 4 5" />
    </svg>
);

const AscentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18L12 4 3 20z" />
        <path d="M12 14v-4" />
        <path d="m10 12 2-2 2 2" />
    </svg>
);

const DescentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4h18L12 20 3 4z" />
        <path d="M12 10v4" />
        <path d="m10 12 2 2 2-2" />
    </svg>
);

const CaloriesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4.5c3 3 1.9 8.5-2 11.5 -3.9 3-8.5 1-11.5-2s-1.9-8.5 2-11.5c3.5-3.5 8.5-1.5 11.5 2z" />
        <path d="M12 12c-2.5 2.5-2.5 5-2.5 5" />
    </svg>
);

const ActiveTimeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 12l3-3 3 3 4-4" />
        <path d="M17 12V6" />
        <path d="M21 12h-4" />
        <path d="M3 12h4" />
        <path d="M12 21a9 9 0 0 0 9-9" />
        <path d="M3 12a9 9 0 0 1 9-9" />
    </svg>
);

const RestTimeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 9h4l-4 6h4" />
        <path d="M13 9h4l-4 6h4" />
    </svg>
);


const BMIIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
        <path d="M12 15a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8z" opacity="0.4"/>
    </svg>
);

// --- Component ---

const ActivityDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activityData, setActivityData] = useState<ActivityData>({ distance: 0, elevationGain: 0, elevationLoss: 0, calories: 0, activeTime: 0, restTime: 0 });
    const [bmr, setBmr] = useState<number | null>(null);
    const lastPosition = useRef<GeolocationCoordinates | null>(null);
    const lastTimestamp = useRef<number | null>(null);
    const watchId = useRef<number | null>(null);

    // Effect to calculate BMR when user data is available
    useEffect(() => {
        if (user) {
            const userBmr = calculateBMR(user);
            setBmr(userBmr);
        }
    }, [user]);

    // Main effect for tracking location and calculating stats
    useEffect(() => {
        if (!user) return;

        const initialData = getActivityData(user.username);
        setActivityData(initialData);
        if (!lastTimestamp.current) {
            lastTimestamp.current = initialData.startTime || Date.now();
        }

        const handlePositionUpdate = (position: GeolocationPosition) => {
            const currentCoords = position.coords;
            const currentTime = position.timestamp;

            saveUserLocation(user.username, currentCoords, currentTime);

            if (lastPosition.current && lastTimestamp.current) {
                const timeDelta = (currentTime - lastTimestamp.current) / 1000; // in seconds
                if (timeDelta <= 0) return; // Ignore invalid time deltas

                const prevCoords = lastPosition.current;

                const distanceIncrement = getDistanceFromLatLonInM(
                    prevCoords.latitude,
                    prevCoords.longitude,
                    currentCoords.latitude,
                    currentCoords.longitude
                );

                const isMoving = distanceIncrement >= 5;
                
                let elevationIncrement = 0;
                let elevationDecrement = 0;
                if (currentCoords.altitude && prevCoords.altitude) {
                    const altDiff = currentCoords.altitude - prevCoords.altitude;
                    if (altDiff > 1) { // Threshold to reduce noise
                        elevationIncrement = altDiff;
                    } else if (altDiff < -1) {
                        elevationDecrement = -altDiff;
                    }
                }
                
                // --- NEW CALORIE CALCULATION ---
                let caloriesIncrement = 0;
                if (bmr) {
                    // Speed in km/h
                    const speedKmh = (distanceIncrement / timeDelta) * 3.6;

                    // Assign MET value based on activity level
                    let met = 1.0; // Resting MET value
                    if (speedKmh > 5) {
                        met = 6.0; // Hiking MET value
                    } else if (speedKmh > 0.1) {
                        met = 3.5; // Walking MET value
                    }
                    
                    // Formula: Calories burned = ((BMR / 24) * MET * hours)
                    // We calculate it per second: (BMR / 86400) * MET * seconds
                    caloriesIncrement = (bmr / 86400) * met * timeDelta;
                }
                // --- END NEW CALCULATION ---
                
                setActivityData(prevData => {
                    const newData: ActivityData = {
                        ...prevData,
                        distance: prevData.distance + distanceIncrement,
                        elevationGain: prevData.elevationGain + elevationIncrement,
                        elevationLoss: prevData.elevationLoss + elevationDecrement,
                        calories: prevData.calories + caloriesIncrement,
                        activeTime: prevData.activeTime + (isMoving ? timeDelta : 0),
                        restTime: prevData.restTime + (isMoving ? 0 : timeDelta),
                    };
                    saveActivityData(user.username, newData);
                    return newData;
                });
            }
            lastPosition.current = currentCoords;
            lastTimestamp.current = currentTime;
        };

        const handleError = (error: GeolocationPositionError) => {
            console.warn(`Activity Tracker Error: ${error.message}`);
        };

        watchId.current = navigator.geolocation.watchPosition(
            handlePositionUpdate,
            handleError,
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );

        return () => {
            if (watchId.current) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };

    }, [user, bmr]);

    const bmi = user && user.height && user.weight
        ? (user.weight / ((user.height / 100) ** 2)).toFixed(1)
        : 'N/A';

    return (
        <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-yellow-300/20">
            <h2 className="font-cinzel text-2xl text-yellow-300 mb-4 border-b-2 border-yellow-300/30 pb-2">Journey Analysis</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-900/50 p-3 rounded-full ring-1 ring-yellow-400/30"><FootprintsIcon /></div>
                    <div>
                        <p className="text-sm text-yellow-200/80">Distance</p>
                        <p className="text-xl font-bold text-white">{(activityData.distance / 1000).toFixed(2)} <span className="text-base font-normal text-gray-300">km</span></p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-900/50 p-3 rounded-full ring-1 ring-yellow-400/30"><CaloriesIcon /></div>
                    <div>
                        <p className="text-sm text-yellow-200/80">Energy Burned</p>
                        <p className="text-xl font-bold text-white">{Math.round(activityData.calories)} <span className="text-base font-normal text-gray-300">kcal</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-yellow-900/50 p-3 rounded-full ring-1 ring-yellow-400/30"><AscentIcon /></div>
                    <div>
                        <p className="text-sm text-yellow-200/80">Ascent</p>
                        <p className="text-xl font-bold text-white">{Math.round(activityData.elevationGain)} <span className="text-base font-normal text-gray-300">m</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-yellow-900/50 p-3 rounded-full ring-1 ring-yellow-400/30"><DescentIcon /></div>
                    <div>
                        <p className="text-sm text-yellow-200/80">Descent</p>
                        <p className="text-xl font-bold text-white">{Math.round(activityData.elevationLoss)} <span className="text-base font-normal text-gray-300">m</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-yellow-900/50 p-3 rounded-full ring-1 ring-yellow-400/30"><ActiveTimeIcon /></div>
                    <div>
                        <p className="text-sm text-yellow-200/80">Moving Time</p>
                        <p className="text-xl font-bold text-white tabular-nums">{formatTime(activityData.activeTime)}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-900/50 p-3 rounded-full ring-1 ring-yellow-400/30"><RestTimeIcon /></div>
                    <div>
                        <p className="text-sm text-yellow-200/80">Rest Time</p>
                        <p className="text-xl font-bold text-white tabular-nums">{formatTime(activityData.restTime)}</p>
                    </div>
                </div>
                
                 <div className="flex items-center gap-3">
                    <div className="bg-yellow-900/50 p-3 rounded-full ring-1 ring-yellow-400/30"><BMIIcon /></div>
                    <div>
                        <p className="text-sm text-yellow-200/80">BMI</p>
                        <p className="text-xl font-bold text-white">{bmi}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ActivityDashboard;
