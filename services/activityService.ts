import { ActivityData } from '../types';

const ACTIVITY_DATA_KEY_PREFIX = 'treasure-activity-data-';

export const getActivityData = (username: string): ActivityData => {
    const data = localStorage.getItem(`${ACTIVITY_DATA_KEY_PREFIX}${username}`);
    if (data) {
        const parsedData = JSON.parse(data);
        // Ensure new fields exist for backward compatibility with old data
        if (parsedData.elevationLoss === undefined) {
            parsedData.elevationLoss = 0;
        }
        if (parsedData.startTime === undefined) {
            parsedData.startTime = Date.now();
        }
        if (parsedData.activeTime === undefined) {
            parsedData.activeTime = 0;
        }
        if (parsedData.restTime === undefined) {
            parsedData.restTime = 0;
        }

        // Remove old field if it exists
        delete parsedData.elevationProfile;
        return parsedData;
    }
    // Return a default starting object if no data exists
    return {
        distance: 0,
        elevationGain: 0,
        elevationLoss: 0,
        calories: 0,
        startTime: Date.now(),
        activeTime: 0,
        restTime: 0,
    };
};

export const saveActivityData = (username: string, data: ActivityData): void => {
    localStorage.setItem(`${ACTIVITY_DATA_KEY_PREFIX}${username}`, JSON.stringify(data));
};

export const resetActivityData = (username: string): void => {
    localStorage.removeItem(`${ACTIVITY_DATA_KEY_PREFIX}${username}`);
};