import { UserLocation } from '../types';
import { getUsers } from './userService';

const LOCATION_DATA_KEY_PREFIX = 'treasure-location-data-';
const ACTIVE_THRESHOLD_SECONDS = 20; // User is considered 'active' if location updated within this time

export const saveUserLocation = (username: string, coords: GeolocationCoordinates, timestamp: number): void => {
    const locationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: timestamp
    };
    localStorage.setItem(`${LOCATION_DATA_KEY_PREFIX}${username}`, JSON.stringify(locationData));
};

const getUserRawLocation = (username: string): { latitude: number, longitude: number, timestamp: number } | null => {
    const data = localStorage.getItem(`${LOCATION_DATA_KEY_PREFIX}${username}`);
    return data ? JSON.parse(data) : null;
};

export const getAllUsersLocations = (): UserLocation[] => {
    const allUsers = getUsers().filter(u => u.role === 'user' && !u.isDeleted);
    const locations: UserLocation[] = [];
    const now = Date.now();

    for (const user of allUsers) {
        const rawLocation = getUserRawLocation(user.username);
        if (rawLocation) {
            const secondsSinceUpdate = (now - rawLocation.timestamp) / 1000;
            const status: 'active' | 'offline' = secondsSinceUpdate < ACTIVE_THRESHOLD_SECONDS ? 'active' : 'offline';

            locations.push({
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                status: status,
                ...rawLocation
            });
        }
    }
    return locations;
};