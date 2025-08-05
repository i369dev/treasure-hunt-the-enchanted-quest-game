import L from 'leaflet';
import { UserLocation } from '../types';

// Simple hash function to get a color from a string
const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
};

// Function to get initials from a name
const getInitials = (firstName: string, lastName: string): string => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return `${first}${last}`.toUpperCase();
}

export const createUserLiveIcon = (user: UserLocation): L.DivIcon => {
    const initials = getInitials(user.firstName, user.lastName);
    const color = stringToColor(user.username);
    const isActive = user.status === 'active';

    const iconHTML = `
    <div style="
        background-color: ${isActive ? color : '#6b7280'}; /* Grey for offline */
        opacity: ${isActive ? 1 : 0.6};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Lato', sans-serif;
        font-weight: bold;
        color: white;
        font-size: 14px;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        animation: ${isActive ? 'pulse-glow-marker 2s infinite ease-in-out' : 'none'};
        transition: background-color 0.5s, opacity 0.5s;
    ">
        ${initials}
    </div>
    `;

    return new L.DivIcon({
        html: iconHTML,
        className: 'user-live-marker-icon', // custom class to avoid conflicts
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
    });
};