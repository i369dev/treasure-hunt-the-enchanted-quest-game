import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './AppRouter';
import PermissionsGate from './components/PermissionsGate';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  // Add a global click listener for button sound effects
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest('button');
      // Play sound if a button is clicked and it doesn't have an opt-out attribute
      if (button && !button.hasAttribute('data-no-sound')) {
        audioService.playButtonClickSound();
      }
    };

    document.addEventListener('click', handleClick);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []); // Empty dependency array ensures this runs only once

  return (
    <AuthProvider>
      <PermissionsGate>
        <AppRouter />
      </PermissionsGate>
    </AuthProvider>
  );
};

export default App;