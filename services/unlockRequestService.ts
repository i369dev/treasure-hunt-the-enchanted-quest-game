import { UnlockRequest, UnlockRequestStatus } from '../types';

const UNLOCK_REQUESTS_KEY = 'treasure-hunt-unlock-requests';

/**
 * Retrieves all unlock requests from localStorage.
 * @returns {UnlockRequest[]} An array of unlock requests, sorted with newest first.
 */
export const getUnlockRequests = (): UnlockRequest[] => {
    const data = localStorage.getItem(UNLOCK_REQUESTS_KEY);
    const requests: UnlockRequest[] = data ? JSON.parse(data) : [];
    // Sort by most recent first
    return requests.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Saves an array of unlock requests to localStorage.
 * @param {UnlockRequest[]} requests - The array of requests to save.
 */
const saveUnlockRequests = (requests: UnlockRequest[]): void => {
    localStorage.setItem(UNLOCK_REQUESTS_KEY, JSON.stringify(requests));
};

/**
 * Adds a new unlock request to the system.
 * @param {Omit<UnlockRequest, 'id' | 'timestamp' | 'status'>} requestData - The data for the new request.
 */
export const addUnlockRequest = (requestData: Omit<UnlockRequest, 'id' | 'timestamp' | 'status'>): void => {
    const requests = getUnlockRequests();
    const newRequest: UnlockRequest = {
        ...requestData,
        id: `unlock-req-${Date.now()}`,
        timestamp: Date.now(),
        status: 'Pending',
    };
    requests.push(newRequest);
    saveUnlockRequests(requests);
};

/**
 * Updates the status of an existing unlock request.
 * @param {string} requestId - The ID of the request to update.
 * @param {UnlockRequestStatus} status - The new status for the request.
 */
export const updateRequestStatus = (requestId: string, status: UnlockRequestStatus): void => {
    let requests = getUnlockRequests();
    const requestIndex = requests.findIndex(req => req.id === requestId);
    if (requestIndex > -1) {
        requests[requestIndex].status = status;
        saveUnlockRequests(requests);
    }
};
