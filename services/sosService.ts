import { User, SOSAlert } from '../types';

const SOS_ALERTS_KEY = 'treasure-hunt-sos-alerts';

export const getSOSAlerts = (): SOSAlert[] => {
    const data = localStorage.getItem(SOS_ALERTS_KEY);
    const alerts: SOSAlert[] = data ? JSON.parse(data) : [];
    // Sort by most recent first
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
};

export const sendSOSAlert = (user: User, location: GeolocationCoordinates): void => {
    const alerts = getSOSAlerts(); // getSOSAlerts already returns sorted, but we just need the array
    
    const newAlert: SOSAlert = {
        id: `sos-${user.username}-${Date.now()}`,
        userId: user.username, // In User type, username is the unique ID
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        location: {
            latitude: location.latitude,
            longitude: location.longitude,
        },
        timestamp: Date.now(),
    };

    // Prepend the new alert to keep the array sorted by newest first
    const updatedAlerts = [newAlert, ...alerts];
    
    localStorage.setItem(SOS_ALERTS_KEY, JSON.stringify(updatedAlerts));
};
