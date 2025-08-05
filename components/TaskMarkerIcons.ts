import L from 'leaflet';

const numberedPinHTML = (taskNumber: number) => `
<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
    <path d="M16 0 C7.163 0 0 7.163 0 16 C0 28 16 42 16 42 S32 28 32 16 C32 7.163 24.837 0 16 0 Z" fill="#b91c1c" stroke="#fef2f2" stroke-width="1.5"/>
    <text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle" font-size="16px" font-family="'Cinzel Decorative', cursive" fill="white" font-weight="bold">${taskNumber}</text>
</svg>
`;

const treasureChestHTML = `
<svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.7));">
    <g stroke="#ca8a04" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="9" width="18" height="10" rx="1" fill="#a16207"/>
        <path d="M3 10C3 7.79086 4.79086 6 7 6H17C19.2091 6 21 7.79086 21 10V10H3V10Z" fill="#854d0e"/>
        <path d="M12 6V9" stroke-width="2"/>
        <path d="M8 14H16" stroke-width="2"/>
         <circle cx="12" cy="14" r="1.5" fill="#fde047" stroke-width="1"/>
    </g>
</svg>
`;

export const createNumberedTaskIcon = (taskNumber: number) => {
    return new L.DivIcon({
        html: numberedPinHTML(taskNumber),
        className: 'player-marker-icon', // To make bg transparent
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42]
    });
};

export const finalTaskIcon = new L.DivIcon({
    html: treasureChestHTML,
    className: 'player-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});
