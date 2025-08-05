
export interface SubTask {
    id: string;
    description: string;
    type: 'checkbox' | 'photo' | 'riddle' | 'screenshot_upload';
    riddleAnswer?: string; // Optional, only for riddle type
    isCompleted: boolean;
}

export interface Task {
    id:string;
    title: string;
    riddle: string;
    isCompleted: boolean;
    subTasks: SubTask[];
    completionLocation?: { latitude: number; longitude: number; } | null;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    tasks: Task[];
}

export type Role = 'admin' | 'user';

export interface GroupMember {
    id:string;
    name: string;
    idType: 'id' | 'passport';
    idNumber: string;
    age?: string;
    gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    height?: number; // in cm
    weight?: number; // in kg
}

export interface User {
    username: string;
    role: Role;
    masterKey: string;
    firstName: string;
    lastName: string;
    idType: 'id' | 'passport';
    idNumber: string;
    age?: string; // Added for manual entry with passports
    gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    address: string;
    mobileNumber: string;
    email: string;
    height?: number; // in cm
    weight?: number; // in kg
    groupMemberDetails: GroupMember[];
    isDeleted?: boolean;
}

export interface UnlockNotification {
    id: string;
    subtaskId: string;
    message: string;
    type: 'approved' | 'rejected';
}

export interface QuestState {
    quest: Quest;
    currentTaskIndex: number;
    notifications?: UnlockNotification[];
}

export interface UserAsset {
    id: string;
    userId: string;
    taskId: string;
    subtaskId: string;
    timestamp: number;
    imageDataUrl: string;
    location: {
        latitude: number;
        longitude: number;
    } | null;
}

export interface ActivityData {
    distance: number; // in meters
    elevationGain: number; // in meters
    elevationLoss: number; // in meters
    calories: number; // in kcal
    startTime?: number; // timestamp of session start
    activeTime: number; // in seconds
    restTime: number; // in seconds
}

export interface UserLocation {
    username: string;
    firstName: string;
    lastName: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    status: 'active' | 'offline';
}

export interface SOSAlert {
    id: string;
    userId: string;
    username: string;
    firstName: string;
    lastName: string;
    location: {
        latitude: number;
        longitude: number;
    };
    timestamp: number;
}

export type UnlockRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface UnlockRequest {
    id: string;
    userId: string; // username
    username: string;
    firstName: string;
    lastName: string;
    taskId: string;
    subtaskId?: string;
    taskTitle: string;
    subtaskDescription?: string;
    reason: string;
    timestamp: number;
    status: UnlockRequestStatus;
}