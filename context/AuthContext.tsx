import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getUsers, initializeUsers } from '../services/userService';

interface AuthContextType {
    user: User | null;
    login: (masterKey: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        initializeUsers(); // Ensure default users exist
        const storedUser = localStorage.getItem('treasure-hunt-user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (masterKey: string): boolean => {
        const allUsers = getUsers();
        const foundUser = allUsers.find(u => u.masterKey === masterKey.trim());
        
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('treasure-hunt-user', JSON.stringify(foundUser));
            return true;
        }
        
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('treasure-hunt-user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
