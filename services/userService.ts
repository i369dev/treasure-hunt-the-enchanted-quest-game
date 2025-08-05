import { app } from '../firebase-config';
import { getFirestore } from "firebase/firestore";
import { User, Quest, GroupMember, Task, SubTask } from '../types';
import { getMasterQuest } from './masterQuestService';
import { QuestState } from '../types';
import { saveQuestState, createNewQuestState } from './questService';


const db = getFirestore(app);

const USERS_STORAGE_KEY = 'treasure-hunt-users';

const DEFAULT_USERS: User[] = [
    { 
        username: 'admin', 
        role: 'admin', 
        masterKey: 'admin.001',
        firstName: 'Admin',
        lastName: 'User',
        idType: 'id',
        idNumber: 'A001',
        age: 'N/A',
        gender: 'Prefer not to say',
        address: '123 System Lane',
        mobileNumber: '555-0100',
        email: 'admin@system.local',
        height: 175,
        weight: 70,
        groupMemberDetails: [],
        isDeleted: false
    },
    { 
        username: 'adventurer', 
        role: 'user', 
        masterKey: 'adventurer.001',
        firstName: 'Brave',
        lastName: 'Adventurer',
        idType: 'id',
        idNumber: '9001015000V',
        age: '34', // Assuming current year makes this age correct
        gender: 'Prefer not to say',
        address: 'The Enchanted Forest',
        mobileNumber: '555-0101',
        email: 'adventurer@quest.local',
        height: 180,
        weight: 75,
        groupMemberDetails: [],
        isDeleted: false
    }
];

export const initializeUsers = (): void => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!storedUsers) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    } else {
        // Migration logic for existing users
        const users = JSON.parse(storedUsers);
        let wasUpdated = false;
        users.forEach((user: User) => {
            if (user.height === undefined) {
                user.height = user.role === 'admin' ? 175 : 180;
                wasUpdated = true;
            }
            if (user.weight === undefined) {
                user.weight = user.role === 'admin' ? 70 : 75;
                wasUpdated = true;
            }
        });
        if (wasUpdated) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
    }
};

export const getUsers = (): User[] => {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
};

const saveUsers = (users: User[]): void => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const addUser = (newUserData: Omit<User, 'role' | 'isDeleted'>): { success: boolean, message: string } => {
    if(!newUserData.username?.trim()) {
        return { success: false, message: 'Username cannot be empty.' };
    }
    if(!newUserData.firstName?.trim() || !newUserData.lastName?.trim()) {
        return { success: false, message: 'First and Last name are required.' };
    }
    if(!newUserData.masterKey?.trim()) {
        return { success: false, message: 'Master Key cannot be empty.' };
    }

    const sanitizedUsername = newUserData.username.trim().toLowerCase();
    const users = getUsers();

    if (users.some(u => u.username === sanitizedUsername)) {
        return { success: false, message: 'Username already exists.' };
    }
    if (users.some(u => u.masterKey === newUserData.masterKey.trim())) {
        return { success: false, message: 'Master Key already exists. Please edit it.' };
    }

    const newUser: User = {
        ...newUserData,
        username: sanitizedUsername,
        role: 'user',
        isDeleted: false,
    };
    users.push(newUser);
    saveUsers(users);

    // New user's Quest Log is populated with master tasks.
    createNewQuestState(newUser.username);

    return { success: true, message: 'User created successfully.' };
};

export const updateUser = (username: string, updatedData: User): { success: boolean, message: string } => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    // Check for master key collision, excluding the user being updated
    if (users.some(u => u.username !== username && u.masterKey === updatedData.masterKey.trim())) {
        return { success: false, message: 'Master Key already exists for another user.' };
    }

    users[userIndex] = updatedData;
    saveUsers(users);
    return { success: true, message: 'User updated successfully.' };
};


export const softDeleteUser = (username: string): void => {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex > -1) {
        const userToDelete = users[userIndex];
        if(userToDelete && userToDelete.role === 'admin') {
            console.warn("Cannot delete the admin user.");
            return;
        }
        users[userIndex].isDeleted = true;
        saveUsers(users);
    }
};

export const restoreUser = (username: string): void => {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex > -1) {
        users[userIndex].isDeleted = false;
        saveUsers(users);
    }
};

export const permanentlyDeleteUser = (username: string): void => {
    let users = getUsers();
    const userToDelete = users.find(u => u.username === username);
    if(userToDelete && userToDelete.role === 'admin') {
        console.warn("Cannot delete the admin user.");
        return;
    }
    users = users.filter(u => u.username !== username);
    saveUsers(users);
};
