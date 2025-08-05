import L from 'leaflet';

const iconHTML = `<svg 
    width="32" 
    height="32" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
    style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.7))"
>
    <circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#ffffff"/>
</svg>`;

export const userIcon = new L.DivIcon({
  html: iconHTML,
  className: 'player-marker-icon', // Use same class to get transparent background
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});