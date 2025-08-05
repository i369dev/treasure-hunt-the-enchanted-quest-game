import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300/50" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 6a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 4a2 2 0 100 4h4a2 2 0 100-4H6z" clipRule="evenodd" />
    </svg>
);


const LoginPage: React.FC = () => {
    const [masterKey, setMasterKey] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const success = login(masterKey);
        if (!success) {
            setError('Invalid Master Key. Access denied.');
        }
    };

    return (
        <div className="w-full max-w-md bg-black/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border-2 border-yellow-400/50">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-cinzel font-bold text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    Guardian's Gate
                </h1>
                <p className="text-yellow-100/80 mt-2">Provide your Master Key to proceed.</p>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="masterKey" className="block text-yellow-200/80 text-sm font-bold mb-2">
                        Master Key
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyIcon />
                        </div>
                        <input
                            id="masterKey"
                            type="text"
                            value={masterKey}
                            onChange={(e) => setMasterKey(e.target.value)}
                            placeholder="e.g., 001.username"
                            className="w-full bg-black/40 border border-yellow-300/30 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            required
                        />
                    </div>
                </div>
                {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
                <div className="mt-6">
                    <button
                        type="submit"
                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 shadow-lg transform hover:scale-105"
                    >
                        Unlock
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;
