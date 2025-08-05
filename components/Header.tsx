
import React from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
    onViewTerms: () => void;
}

const ScrollIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2H9z" />
        <path d="M4 12a2 2 0 012-2h10a2 2 0 012 2v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ onViewTerms }) => {
    const { user, logout } = useAuth();

    return (
        <header className="w-full text-center mb-8 px-4">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <div className="text-left">
                    {user && (
                        <div className="text-white">
                           <span className="text-sm opacity-80">Welcome,</span>
                           <p className="font-bold text-lg">{user.username}</p>
                           {user.role === 'user' && (
                                <button 
                                    onClick={onViewTerms} 
                                    className="flex items-center gap-1.5 text-yellow-200/70 hover:text-yellow-100 hover:underline text-xs mt-2 transition-colors duration-200"
                                    aria-label="View Terms and Conditions"
                                >
                                    <ScrollIcon />
                                    <span>View Adventurer's Code</span>
                                </button>
                           )}
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-cinzel font-bold text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        Treasure Hunt
                    </h1>
                    <p className="text-lg sm:text-xl text-yellow-100/90 font-cinzel tracking-wider mt-1">The Enchanted Quest</p>
                </div>

                <div className="text-right">
                    {user && (
                        <button 
                            onClick={logout}
                            className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md text-sm"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;