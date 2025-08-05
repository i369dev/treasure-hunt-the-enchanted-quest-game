import L from 'leaflet';

const iconHTML = `<svg 
    width="40" 
    height="40" 
    viewBox="0 0 100 100" 
    xmlns="http://www.w3.org/2000/svg"
    class="player-svg-animate"
>
    <polygon points="50,0 60,40 100,50 60,60 50,100 40,60 0,50 40,40" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
    <polygon points="50,20 55,45 80,50 55,55 50,80 45,55 20,50 45,45" fill="#fde047" />
    <circle cx="50" cy="50" r="10" fill="#ca8a04"/>
</svg>`;

export const playerIcon = new L.DivIcon({
  html: iconHTML,
  className: 'player-marker-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});