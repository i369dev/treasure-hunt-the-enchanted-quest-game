
import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { User, QuestState, UserAsset, ActivityData, GroupMember, SOSAlert, UnlockRequest, UnlockNotification } from '../types';
import { getUsers, addUser, softDeleteUser, permanentlyDeleteUser, updateUser, restoreUser } from '../services/userService';
import { getQuestState, resetQuestState, saveQuestState } from '../services/questService';
import { getUserAssets } from '../services/assetService';
import { getActivityData } from '../services/activityService';
import { getSOSAlerts } from '../services/sosService';
import { getUnlockRequests, updateRequestStatus } from '../services/unlockRequestService';
import { audioService } from '../services/audioService';
import LoadingSpinner from '../components/LoadingSpinner';
import MasterQuestManager from '../components/MasterQuestManager';
import LiveMap from './LiveMap';
import UserQuestProgress from '../components/UserQuestProgress';

// --- Helper Functions ---
const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// --- Reusable Themed Modal Component ---
const ThemedModal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl z-50 animate-fade-in">
            <div className="relative w-full h-full flex flex-col">
                <button onClick={onClose} className="absolute top-5 right-5 text-white bg-red-700 rounded-full h-10 w-10 flex items-center justify-center text-2xl font-bold z-20 hover:bg-red-600 transition-colors" aria-label="Close modal">&times;</button>
                <div className="overflow-y-auto p-6 sm:p-8 pt-20 w-full h-full">
                    {children}
                </div>
            </div>
        </div>
    );
};


// --- User Form Components (retained from original structure for consistency) ---
const calculateAge = (idNumber: string): number | null => {
    if (!idNumber) return null;
    let birthDate: Date | null = null;
    const cleanedId = idNumber.replace(/[VvXx]$/, '').trim();
    let expectedYear: number | null = null;
    if (cleanedId.length === 12 && /^\d{12}$/.test(cleanedId)) {
        const year = parseInt(cleanedId.substring(0, 4), 10);
        const dayOfYear = parseInt(cleanedId.substring(4, 7), 10);
        if (dayOfYear < 1 || dayOfYear > 366) return null;
        expectedYear = year;
        birthDate = new Date(year, 0, dayOfYear);
    } 
    else if (cleanedId.length === 9 && /^\d{9}$/.test(cleanedId)) {
        const yearDigits = parseInt(cleanedId.substring(0, 2), 10);
        let dayOfYear = parseInt(cleanedId.substring(2, 5), 10);
        if (dayOfYear > 500) { dayOfYear -= 500; }
        if (dayOfYear < 1 || dayOfYear > 366) return null;
        const currentYearLastTwoDigits = new Date().getFullYear() % 100;
        const year = (yearDigits > currentYearLastTwoDigits ? 1900 : 2000) + yearDigits;
        expectedYear = year;
        birthDate = new Date(year, 0, dayOfYear);
    } else {
        return null;
    }
    if (!birthDate || isNaN(birthDate.getTime()) || birthDate.getFullYear() !== expectedYear) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
    return age >= 0 ? age : null;
};

const FormInput: React.FC<{label: string, name: string, value: string | number, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean, type?: string, placeholder?: string, containerClassName?: string }> = ({ label, name, value, onChange, disabled, type="text", placeholder, containerClassName = '' }) => (
    <div className={containerClassName}>
        <label htmlFor={name} className="block text-yellow-200/80 text-sm font-bold mb-1">{label}</label>
        <input id={name} name={name} type={type} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-white focus:ring-yellow-400 focus:border-yellow-400 transition disabled:bg-gray-700/50 disabled:text-gray-400"/>
    </div>
);

const FormTextArea: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-yellow-200/80 text-sm font-bold mb-1">{label}</label>
        <textarea id={name} name={name} value={value} onChange={onChange} rows={2} className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-white focus:ring-yellow-400 focus:border-yellow-400 transition"/>
    </div>
);

const UserForm: React.FC<{
    isEditMode: boolean;
    formState: any; // Using 'any' for flexibility with form state (e.g., numbers as strings)
    onSubmit: (e: FormEvent) => void;
    onCancel?: () => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleGroupMemberChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    addGroupMember: () => void;
    removeGroupMember: (index: number) => void;
    handleMasterKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error: string;
}> = ({ isEditMode, formState, onSubmit, onCancel, handleInputChange, handleGroupMemberChange, addGroupMember, removeGroupMember, handleMasterKeyChange, error, }) => {
    if (!formState) return null;
    const isPassport = formState.idType === 'passport';
    const calculatedAge = calculateAge(formState.idNumber);

    return (
         <form onSubmit={onSubmit} className="space-y-3">
             <h3 className="font-cinzel text-2xl text-yellow-300 pb-2 border-b border-yellow-300/20">{isEditMode ? `Editing ${formState.firstName}` : 'Create New User'}</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-3">
                <FormInput label="First Name" name="firstName" value={formState.firstName} onChange={handleInputChange} />
                <FormInput label="Last Name" name="lastName" value={formState.lastName} onChange={handleInputChange} />
             </div>
             <FormInput label="Username" name="username" value={formState.username} onChange={handleInputChange} disabled={isEditMode} />
             
             <div className="grid grid-cols-3 gap-x-2 items-end">
                <div className="col-span-1">
                    <label htmlFor="idType" className="block text-yellow-200/80 text-sm font-bold mb-1">ID Type</label>
                    <select id="idType" name="idType" value={formState.idType} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-white focus:ring-yellow-400 focus:border-yellow-400 transition h-[42px]">
                        <option value="id">ID</option>
                        <option value="passport">Passport</option>
                    </select>
                </div>
                <FormInput label="ID/Passport Number" name="idNumber" value={formState.idNumber} onChange={handleInputChange} containerClassName="col-span-2"/>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-3">
                <FormInput label="Age" name="age" value={isPassport ? (formState.age || '') : (calculatedAge !== null ? String(calculatedAge) : 'N/A')} onChange={handleInputChange} disabled={!isPassport} type="number" placeholder={isPassport ? 'Enter age' : 'Auto-calculated'} />
                <div>
                     <label htmlFor="gender" className="block text-yellow-200/80 text-sm font-bold mb-1">Gender</label>
                     <select id="gender" name="gender" value={formState.gender} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-white focus:ring-yellow-400 focus:border-yellow-400 transition h-[42px]">
                         <option value="Prefer not to say">Prefer not to say</option> <option value="Male">Male</option> <option value="Female">Female</option> <option value="Other">Other</option>
                     </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-3">
                <FormInput label="Height (cm)" name="height" value={formState.height || ''} onChange={handleInputChange} type="number" placeholder="e.g., 180" />
                <FormInput label="Weight (kg)" name="weight" value={formState.weight || ''} onChange={handleInputChange} type="number" placeholder="e.g., 75" />
            </div>
             
             <FormInput label="Email Address" name="email" value={formState.email} onChange={handleInputChange} type="email" />
             <FormInput label="Mobile Number" name="mobileNumber" value={formState.mobileNumber} onChange={handleInputChange} />
             <FormTextArea label="Address" name="address" value={formState.address} onChange={handleInputChange} />
             
             <div>
                <h4 className="text-yellow-200/80 text-sm font-bold mb-1">Group Member Details</h4>
                <div className="space-y-2 p-2 border border-white/10 rounded-md">
                    {formState.groupMemberDetails.length === 0 && <p className="text-xs text-gray-400 text-center">No group members added.</p>}
                    {formState.groupMemberDetails.map((member: any, index: number) => {
                        const memberCalculatedAge = calculateAge(member.idNumber);
                        const isMemberPassport = member.idType === 'passport';
                        return (
                            <div key={member.id} className="bg-black/20 p-3 rounded-lg space-y-2 border border-yellow-300/10">
                                <div className="flex justify-between items-center"><input name="name" placeholder="Full Name" value={member.name} onChange={e => handleGroupMemberChange(index, e)} className="flex-grow bg-white/10 border border-white/20 rounded-md p-1 text-white text-sm" /><button type="button" onClick={() => removeGroupMember(index)} className="ml-2 text-red-500 hover:text-red-400 font-bold text-xl leading-none" title="Remove Member">&times;</button></div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <select name="idType" value={member.idType} onChange={e => handleGroupMemberChange(index, e)} className="md:col-span-1 w-full bg-white/10 border border-white/20 rounded-md p-1 text-white text-xs"><option value="id">ID</option><option value="passport">Passport</option></select>
                                    <input name="idNumber" placeholder="ID/Passport Number" value={member.idNumber} onChange={e => handleGroupMemberChange(index, e)} className="md:col-span-3 w-full bg-white/10 border border-white/20 rounded-md p-1 text-white text-xs" />
                                    <select name="gender" value={member.gender} onChange={e => handleGroupMemberChange(index, e)} className="md:col-span-1 w-full bg-white/10 border border-white/20 rounded-md p-1 text-white text-xs"><option value="Prefer not to say">Prefer not to say</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
                                    <input name="age" type="number" placeholder={isMemberPassport ? 'Age' : 'Auto'} value={isMemberPassport ? (member.age || '') : (memberCalculatedAge !== null ? String(memberCalculatedAge) : 'N/A')} onChange={e => handleGroupMemberChange(index, e)} disabled={!isMemberPassport} className="md:col-span-1 w-full bg-white/10 border border-white/20 rounded-md p-1 text-white text-xs disabled:bg-gray-700/50" />
                                    <input name="height" type="number" placeholder="Height (cm)" value={member.height || ''} onChange={e => handleGroupMemberChange(index, e)} className="md:col-span-1 w-full bg-white/10 border border-white/20 rounded-md p-1 text-white text-xs" />
                                    <input name="weight" type="number" placeholder="Weight (kg)" value={member.weight || ''} onChange={e => handleGroupMemberChange(index, e)} className="md:col-span-1 w-full bg-white/10 border border-white/20 rounded-md p-1 text-white text-xs" />
                                </div>
                            </div>
                        )
                    })}
                    <button type="button" onClick={addGroupMember} className="text-xs mt-2 bg-green-800/70 hover:bg-green-700 text-white py-1 px-2 rounded-md">+ Add Member</button>
                </div>
             </div>

             <FormInput label="Master Key" name="masterKey" value={formState.masterKey} onChange={handleMasterKeyChange} placeholder="Auto-generated, editable" />
             {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
             <div className="flex gap-2 pt-4 border-t border-yellow-300/20">
                {isEditMode && <button type="button" onClick={onCancel} className="w-full mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Cancel</button>}
                <button type="submit" className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-transform transform hover:scale-105">{isEditMode ? 'Save Changes' : 'Save New User'}</button>
             </div>
        </form>
    )
}

// --- Main Admin Dashboard Component ---
const AdminDashboard: React.FC = () => {
    // View State
    const [activeView, setActiveView] = useState<'users' | 'quest' | 'map' | 'sos' | 'unlockRequests'>('users');

    // Core Data State
    const [users, setUsers] = useState<User[]>([]);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [editingUser, setEditingUser] = useState<any | null>(null); // Use 'any' for form state flexibility
    
    // Modal State
    const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // Details State (for modal)
    const [questState, setQuestState] = useState<QuestState | null>(null);
    const [assets, setAssets] = useState<UserAsset[]>([]);
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [viewingAsset, setViewingAsset] = useState<UserAsset | null>(null);
    
    // New User Form State
    const initialNewUserState = { firstName: '', lastName: '', username: '', idType: 'id', idNumber: '', age: '', gender: 'Prefer not to say', address: '', mobileNumber: '', email: '', height: '', weight: '', groupMemberDetails: [], masterKey: '' };
    const [newUser, setNewUser] = useState(initialNewUserState);
    const [isUsernameEdited, setIsUsernameEdited] = useState(false);
    const [isMasterKeyEdited, setIsMasterKeyEdited] = useState(false);
    
    // SOS and Unlock Request State
    const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
    const [unlockRequests, setUnlockRequests] = useState<UnlockRequest[]>([]);
    const [sosNotification, setSosNotification] = useState<SOSAlert | null>(null);
    const dataPollingInterval = useRef<number | null>(null);

    // UI Feedback State
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ show: false, message: '' });

    // Effect to control body scrolling when a modal is open
    useEffect(() => {
        const isAnyModalOpen = isUserDetailsModalOpen || isArchiveModalOpen || confirmation.isOpen || !!viewingAsset || !!sosNotification;
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        // Cleanup on component unmount
        return () => { document.body.style.overflow = 'unset'; };
    }, [isUserDetailsModalOpen, isArchiveModalOpen, confirmation.isOpen, viewingAsset, sosNotification]);

    // Load initial data
    useEffect(() => { 
        setUsers(getUsers());
        setSosAlerts(getSOSAlerts());
        setUnlockRequests(getUnlockRequests());
    }, []);
    
    // Poll for new SOS alerts and unlock requests
    useEffect(() => {
        const pollForData = () => {
            // Poll SOS
            const newAlerts = getSOSAlerts();
            if (newAlerts.length > sosAlerts.length) {
                const latestAlert = newAlerts[0];
                setSosNotification(latestAlert);
                audioService.playSOSAlarmSound();
            }
            setSosAlerts(newAlerts);

            // Poll Unlock Requests
            const newRequests = getUnlockRequests();
            setUnlockRequests(newRequests);
        };
        
        dataPollingInterval.current = window.setInterval(pollForData, 5000); // Check every 5 seconds

        return () => {
            if (dataPollingInterval.current) {
                clearInterval(dataPollingInterval.current);
            }
            audioService.stopSOSAlarmSound(); // Stop sound on unmount
        };
    }, [sosAlerts]);


    // Auto-generate username and master key for new user form
    useEffect(() => { if (!isUsernameEdited) { setNewUser(prev => ({ ...prev, username: prev.firstName.toLowerCase().trim() })); }}, [newUser.firstName, isUsernameEdited]);
    useEffect(() => {
        if (!isMasterKeyEdited && newUser.username.trim()) {
            const sanitizedUsername = newUser.username.trim().toLowerCase();
            const generatedKey = `${sanitizedUsername}.${Date.now().toString().slice(-4)}`;
            if (newUser.masterKey !== generatedKey) {
                setNewUser(prev => ({ ...prev, masterKey: generatedKey }));
            }
        } else if (!isMasterKeyEdited && !newUser.username.trim()) {
             if (newUser.masterKey !== '') { setNewUser(prev => ({ ...prev, masterKey: '' })); }
        }
    }, [newUser.username, isMasterKeyEdited]);

    // Live update activity data for viewed user
    useEffect(() => {
        if (!viewingUser || viewingUser.role !== 'user') return;
        const intervalId = setInterval(() => { setActivity(getActivityData(viewingUser.username)); }, 3000);
        return () => clearInterval(intervalId);
    }, [viewingUser]);
    
    const reloadUsers = () => { setUsers(getUsers()); };
    const reloadRequests = () => { setUnlockRequests(getUnlockRequests()) };
    
    const showToast = (message: string) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    // Helper to parse form state (with string numbers) to a proper User object
    const parseUserFormState = (formState: any): User => {
        const parsedState = {
            ...formState,
            height: formState.height ? Number(formState.height) : undefined,
            weight: formState.weight ? Number(formState.weight) : undefined,
            groupMemberDetails: formState.groupMemberDetails.map((m: any) => ({
                ...m,
                age: m.age ? String(m.age) : undefined,
                height: m.height ? Number(m.height) : undefined,
                weight: m.weight ? Number(m.weight) : undefined,
            }))
        };
        // Ensure age is a string for the main user
        if (parsedState.age) {
            parsedState.age = String(parsedState.age);
        }
        return parsedState as User;
    };


    // --- User Actions ---
    const handleViewUser = (user: User) => {
        setViewingUser(user);
        setQuestState(getQuestState(user.username));
        setAssets(getUserAssets(user.username));
        setActivity(getActivityData(user.username));
        setIsUserDetailsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(JSON.parse(JSON.stringify(user)));
    };

    const handleUpdateUser = (e: FormEvent) => {
        e.preventDefault();
        if(!editingUser) return;
        const userToUpdate = parseUserFormState(editingUser);
        const result = updateUser(userToUpdate.username, userToUpdate);
        if(result.success) {
            reloadUsers();
            handleViewUser(userToUpdate); // re-select to show updated details
            setEditingUser(null);
            showToast('User updated successfully.');
        } else {
            setError(result.message);
        }
    };

    const handleAddUser = (e: FormEvent) => {
        e.preventDefault();
        const userToAdd = parseUserFormState(newUser) as Omit<User, 'role' | 'isDeleted'>;
        const result = addUser(userToAdd);
        if (result.success) {
            reloadUsers();
            setNewUser(initialNewUserState);
            setIsUsernameEdited(false);
            setIsMasterKeyEdited(false);
            setError('');
            showToast('User created successfully.');
        } else {
            setError(result.message);
        }
    };
    
    // --- Deletion and Restoration Workflow ---
    const confirmSoftDelete = (user: User) => {
        setConfirmation({
            isOpen: true,
            title: 'Archive User',
            message: `Are you sure you want to move ${user.firstName} ${user.lastName} to the archive?`,
            onConfirm: () => {
                softDeleteUser(user.username);
                reloadUsers();
                setConfirmation({ ...confirmation, isOpen: false });
                showToast('User moved to archive.');
            }
        });
    };
    
    const confirmPermanentDelete = (user: User) => {
        setConfirmation({
            isOpen: true,
            title: 'PERMANENTLY DELETE USER',
            message: `This action is irreversible. All data for ${user.firstName} ${user.lastName} will be destroyed. Proceed?`,
            onConfirm: () => {
                permanentlyDeleteUser(user.username);
                reloadUsers();
                setConfirmation({ ...confirmation, isOpen: false });
                showToast('User permanently deleted.');
            }
        });
    };

    const handleRestoreUser = (user: User) => {
        restoreUser(user.username);
        reloadUsers();
        showToast('User restored.');
    };

    // --- Quest Management ---
    const confirmResetQuest = (username: string) => {
        setConfirmation({
            isOpen: true,
            title: 'Reset Quest',
            message: `Are you sure you want to reset the quest for '${username}'? All their progress will be lost.`,
            onConfirm: () => {
                resetQuestState(username);
                setQuestState(getQuestState(username)); // This will be null, updating the UI
                setConfirmation({ ...confirmation, isOpen: false });
                showToast('Quest has been reset.');
            }
        });
    }

    const handleUnlockTask = (username: string, taskIndex: number) => {
        const state = getQuestState(username);
        if(state) {
            const newState = { ...state, currentTaskIndex: taskIndex };
            saveQuestState(username, newState);
            setQuestState(newState); // Update state in modal
            showToast('Task unlocked!');
        }
    };

    const handleUnlockSubtask = (username: string, taskId: string, subtaskId: string) => {
        const state = getQuestState(username);
        if(state) {
            const newTasks = state.quest.tasks.map(task => {
                if (task.id === taskId) {
                    const newSubtasks = task.subTasks.map(subtask => {
                        if (subtask.id === subtaskId) {
                            return { ...subtask, isCompleted: true };
                        }
                        return subtask;
                    });
                    return { ...task, subTasks: newSubtasks };
                }
                return task;
            });
            const newState = { ...state, quest: { ...state.quest, tasks: newTasks }};
            saveQuestState(username, newState);
            setQuestState(newState); // Update state in modal
            showToast('Sub-task unlocked!');
        }
    };

    // --- Unlock Request Management ---
    const handleApproveRequest = (request: UnlockRequest) => {
        const state = getQuestState(request.userId);
        if (!state) return; // Can't do anything if user has no quest state

        let wasUpdated = false;

        // 1. Unlock subtask
        if (request.subtaskId) {
            const taskIndex = state.quest.tasks.findIndex(t => t.id === request.taskId);
            if (taskIndex > -1) {
                const subtaskIndex = state.quest.tasks[taskIndex].subTasks.findIndex(st => st.id === request.subtaskId);
                if (subtaskIndex > -1 && !state.quest.tasks[taskIndex].subTasks[subtaskIndex].isCompleted) {
                    state.quest.tasks[taskIndex].subTasks[subtaskIndex].isCompleted = true;
                    wasUpdated = true;
                }
            }
        }

        // 2. Add notification
        if (request.subtaskId) {
            const newNotification: UnlockNotification = {
                id: `notif-approve-${Date.now()}`,
                subtaskId: request.subtaskId,
                message: "This task has been manually unlocked for you by a Game Administrator based on your request.",
                type: 'approved'
            };
            if (!state.notifications) state.notifications = [];
            state.notifications.push(newNotification);
            wasUpdated = true;
        }

        // 3. Save updated state only if something changed
        if (wasUpdated) {
            saveQuestState(request.userId, state);
        }
        
        // 4. Update request status and UI
        updateRequestStatus(request.id, 'Approved');
        reloadRequests();
        showToast('Unlock request approved.');
    };

    const handleRejectRequest = (request: UnlockRequest) => {
        const state = getQuestState(request.userId);
        if (!state) return;

        if (request.subtaskId) {
            const newNotification: UnlockNotification = {
                id: `notif-reject-${Date.now()}`,
                subtaskId: request.subtaskId,
                message: "Your unlock request has been reviewed. Please study the task requirements again and re-attempt.",
                type: 'rejected'
            };
            if (!state.notifications) state.notifications = [];
            state.notifications.push(newNotification);
            saveQuestState(request.userId, state);
        }

        updateRequestStatus(request.id, 'Rejected');
        reloadRequests();
        showToast('Unlock request rejected.');
    };
    
    // --- Input Handlers for Forms ---
    const createInputHandler = (setter: React.Dispatch<React.SetStateAction<any>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setter(prev => {
            if (!prev) return null;
            const updated = { ...prev, [name]: value };
            if (name === 'idType' && value === 'passport') { updated.age = ''; }
            return updated;
        });
    };

    const createGroupMemberHandler = (setter: React.Dispatch<React.SetStateAction<any>>) => (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setter(prev => {
            if (!prev) return null;
            const newGroupMembers = JSON.parse(JSON.stringify(prev.groupMemberDetails));
            const memberToUpdate = newGroupMembers[index];
            memberToUpdate[name] = value;
            if (name === 'idType' && value === 'passport') { memberToUpdate.age = ''; }
            return { ...prev, groupMemberDetails: newGroupMembers };
        });
    };
    
    const createGroupMemberManager = (setter: React.Dispatch<React.SetStateAction<any>>) => ({
        add: () => setter(prev => !prev ? null : { ...prev, groupMemberDetails: [...prev.groupMemberDetails, { id: `gm-${Date.now()}`, name: '', idType: 'id', idNumber: '', age: '', gender: 'Prefer not to say', height: '', weight: '' }] }),
        remove: (index: number) => setter(prev => !prev ? null : { ...prev, groupMemberDetails: prev.groupMemberDetails.filter((_: any, i: number) => i !== index) })
    });
    
    const handleNewUserInput = createInputHandler(setNewUser);
    const handleNewUserGroupChange = createGroupMemberHandler(setNewUser);
    const newUserGroupManager = createGroupMemberManager(setNewUser);

    const handleEditingUserInput = createInputHandler(setEditingUser);
    const handleEditingUserGroupChange = createGroupMemberHandler(setEditingUser);
    const editingUserGroupManager = createGroupMemberManager(setEditingUser);

    const activeUsers = users.filter(u => !u.isDeleted);
    const archivedUsers = users.filter(u => u.isDeleted);
    const pendingUnlockRequests = unlockRequests.filter(r => r.status === 'Pending');

    // --- Render ---
    return (
        <div className="w-full flex flex-col gap-8 h-full">
            {/* Top-level Navigation */}
            <div className="flex gap-2 sm:gap-4 border-b-2 border-yellow-300/20 pb-4 flex-wrap">
                <button onClick={() => setActiveView('users')} className={`font-cinzel text-lg sm:text-xl px-4 sm:px-6 py-2 rounded-lg transition-colors ${activeView === 'users' ? 'bg-yellow-600 text-white shadow-lg' : 'bg-black/30 hover:bg-yellow-600/50'}`}>User Management</button>
                <button onClick={() => setActiveView('quest')} className={`font-cinzel text-lg sm:text-xl px-4 sm:px-6 py-2 rounded-lg transition-colors ${activeView === 'quest' ? 'bg-yellow-600 text-white shadow-lg' : 'bg-black/30 hover:bg-yellow-600/50'}`}>Master Quest</button>
                <button onClick={() => setActiveView('map')} className={`font-cinzel text-lg sm:text-xl px-4 sm:px-6 py-2 rounded-lg transition-colors ${activeView === 'map' ? 'bg-yellow-600 text-white shadow-lg' : 'bg-black/30 hover:bg-yellow-600/50'}`}>Live Map</button>
                <button onClick={() => setActiveView('sos')} className={`relative font-cinzel text-lg sm:text-xl px-4 sm:px-6 py-2 rounded-lg transition-colors ${activeView === 'sos' ? 'bg-red-600 text-white shadow-lg' : 'bg-black/30 hover:bg-red-600/50'}`}>
                    SOS Alerts
                    {sosAlerts.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">{sosAlerts.length}</span>}
                </button>
                <button onClick={() => setActiveView('unlockRequests')} className={`relative font-cinzel text-lg sm:text-xl px-4 sm:px-6 py-2 rounded-lg transition-colors ${activeView === 'unlockRequests' ? 'bg-blue-600 text-white shadow-lg' : 'bg-black/30 hover:bg-blue-600/50'}`}>
                    Unlock Requests
                    {pendingUnlockRequests.length > 0 && <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">{pendingUnlockRequests.length}</span>}
                </button>
            </div>

            {toast.show && <div className="fixed top-24 right-8 bg-green-600 text-white font-bold p-3 rounded-lg shadow-lg z-[100] animate-fade-in">{toast.message}</div>}

            {/* User Management View */}
            {activeView === 'users' && (
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                    {/* User Directory */}
                    <div className="md:col-span-1 bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-yellow-300/20 h-fit">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-cinzel text-2xl text-yellow-300">User Directory</h2>
                            <button onClick={() => setIsArchiveModalOpen(true)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-md text-sm">Archive</button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {activeUsers.map(user => (
                                <div key={user.username} className="p-2 rounded-lg flex justify-between items-center bg-white/10">
                                    <div>
                                    <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                                    <p className="text-xs text-gray-400">{user.username} ({user.role})</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleViewUser(user)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-2 rounded">View</button>
                                        {user.role !== 'admin' && <button onClick={() => confirmSoftDelete(user)} className="text-xs bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-2 rounded">Del</button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Create User Form */}
                    <div className="md:col-span-2 bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-yellow-300/20 h-fit">
                        <UserForm
                            isEditMode={false} formState={newUser} onSubmit={handleAddUser}
                            handleInputChange={e => { handleNewUserInput(e); if(e.target.name === 'username') setIsUsernameEdited(true); if(e.target.name === 'firstName') setIsUsernameEdited(false); }}
                            handleGroupMemberChange={handleNewUserGroupChange}
                            addGroupMember={newUserGroupManager.add} removeGroupMember={newUserGroupManager.remove}
                            handleMasterKeyChange={e => { handleNewUserInput(e); setIsMasterKeyEdited(true); }}
                            error={error}
                        />
                    </div>
                </div>
            )}

            {/* Master Quest View */}
            {activeView === 'quest' && <div className="animate-fade-in"><MasterQuestManager /></div>}
            
            {/* Live Map View */}
            {activeView === 'map' && <div className="animate-fade-in flex-1 min-h-0"><LiveMap /></div>}

            {/* SOS Alerts View */}
            {activeView === 'sos' && (
                <div className="animate-fade-in bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-red-500/40 flex flex-col flex-1 min-h-0">
                    <h2 className="font-cinzel text-3xl text-red-400 mb-4 border-b-2 border-red-400/30 pb-2">SOS Alert Log</h2>
                    <div className="space-y-4 overflow-y-auto pr-2">
                        {sosAlerts.length > 0 ? sosAlerts.map(alert => (
                            <div key={alert.id} className="p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center bg-red-900/40 border border-red-500/50 gap-4">
                                <div>
                                    <p className="font-bold text-white text-lg">{alert.firstName} {alert.lastName} <span className="text-gray-400 text-sm">(@{alert.username})</span></p>
                                    <p className="text-sm text-gray-300">Time: {new Date(alert.timestamp).toLocaleString()}</p>
                                </div>
                                <a href={`https://www.google.com/maps?q=${alert.location.latitude},${alert.location.longitude}`} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors w-full sm:w-auto text-center">Open in Maps</a>
                            </div>
                        )) : <p className="text-center text-gray-400 font-cinzel text-xl py-8">No SOS alerts have been received.</p>}
                    </div>
                </div>
            )}

            {/* Unlock Requests View */}
            {activeView === 'unlockRequests' && (
                 <div className="animate-fade-in bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-blue-500/40 flex flex-col flex-1 min-h-0">
                    <h2 className="font-cinzel text-3xl text-blue-300 mb-4 border-b-2 border-blue-300/30 pb-2">Unlock Requests</h2>
                    <div className="space-y-4 overflow-y-auto pr-2">
                        {unlockRequests.length > 0 ? unlockRequests.map(req => (
                            <div key={req.id} className={`p-4 rounded-lg border ${req.status === 'Pending' ? 'bg-blue-900/40 border-blue-500/50' : 'bg-gray-800/40 border-gray-600/50 opacity-70'}`}>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <p className="font-bold text-white text-lg">{req.firstName} {req.lastName} <span className="text-gray-400 text-sm">(@{req.username})</span></p>
                                        <p className="text-sm text-gray-300">Time: {new Date(req.timestamp).toLocaleString()}</p>
                                        <p className="text-sm text-gray-300 mt-1">Status: <span className={`font-semibold ${req.status === 'Pending' ? 'text-yellow-400' : req.status === 'Approved' ? 'text-green-400' : 'text-red-400'}`}>{req.status}</span></p>
                                    </div>
                                    {req.status === 'Pending' && (
                                    <div className="flex gap-2 self-start sm:self-center">
                                        <button onClick={() => handleApproveRequest(req)} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md">Approve & Unlock</button>
                                        <button onClick={() => handleRejectRequest(req)} className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md">Reject</button>
                                    </div>
                                    )}
                                </div>
                                <div className="mt-4 bg-black/30 p-3 rounded-md">
                                    <p className="text-xs text-blue-200/80">Requested Unlock For:</p>
                                    <p className="text-white font-semibold">{req.subtaskDescription || req.taskTitle}</p>
                                    <p className="text-xs text-blue-200/80 mt-2">Reason Provided:</p>
                                    <p className="text-gray-200 italic">"{req.reason}"</p>
                                </div>
                            </div>
                        )) : <p className="text-center text-gray-400 font-cinzel text-xl py-8">No unlock requests have been submitted.</p>}
                    </div>
                </div>
            )}


            {/* Modals are kept outside the conditional rendering flow */}
            <ThemedModal isOpen={isUserDetailsModalOpen} onClose={() => { setIsUserDetailsModalOpen(false); setEditingUser(null); }}>
                {viewingUser && (
                    <>
                    {editingUser ? (
                        <div className="w-full max-w-3xl mx-auto">
                            <UserForm
                                isEditMode={true} formState={editingUser} onSubmit={handleUpdateUser}
                                onCancel={() => setEditingUser(null)}
                                handleInputChange={handleEditingUserInput} handleGroupMemberChange={handleEditingUserGroupChange}
                                addGroupMember={editingUserGroupManager.add} removeGroupMember={editingUserGroupManager.remove}
                                handleMasterKeyChange={handleEditingUserInput} error={error}
                            />
                        </div>
                    ) : (
                    <div>
                        <div className="flex justify-between items-start mb-4 bg-black/30 p-3 rounded-lg">
                            <div>
                                <h2 className="font-cinzel text-3xl text-yellow-300">{viewingUser.firstName} {viewingUser.lastName}</h2>
                                <p className="text-gray-300">{viewingUser.username}</p>
                                <p className="text-xs text-yellow-200/80 font-mono mt-1">Master Key: {viewingUser.masterKey}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button onClick={() => handleEditUser(viewingUser)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-sm self-start">Edit</button>
                                {viewingUser.role !== 'admin' && <button onClick={() => confirmResetQuest(viewingUser.username)} className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-1 px-3 rounded-md text-sm self-start">Reset Quest</button>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Personal Details Section */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-cinzel text-xl text-yellow-400 mb-2 border-b border-yellow-300/20 pb-1">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-lg">
                                        <p><span className="text-sm text-yellow-200/80">Email:</span><br/>{viewingUser.email}</p>
                                        <p><span className="text-sm text-yellow-200/80">Mobile:</span><br/>{viewingUser.mobileNumber}</p>
                                        <p className="col-span-2"><span className="text-sm text-yellow-200/80">Address:</span><br/>{viewingUser.address}</p>
                                        <p><span className="text-sm text-yellow-200/80">{viewingUser.idType.toUpperCase()}:</span><br/>{viewingUser.idNumber}</p>
                                        <p><span className="text-sm text-yellow-200/80">Age:</span><br/>{viewingUser.idType === 'passport' ? viewingUser.age : calculateAge(viewingUser.idNumber)}</p>
                                        <p><span className="text-sm text-yellow-200/80">Gender:</span><br/>{viewingUser.gender}</p>
                                        <p><span className="text-sm text-yellow-200/80">Height:</span><br/>{viewingUser.height ? `${viewingUser.height} cm` : 'N/A'}</p>
                                        <p><span className="text-sm text-yellow-200/80">Weight:</span><br/>{viewingUser.weight ? `${viewingUser.weight} kg` : 'N/A'}</p>
                                         <p className="col-span-2"><span className="text-sm text-yellow-200/80">BMI:</span><br/>
                                            {viewingUser.height && viewingUser.weight ? (viewingUser.weight / ((viewingUser.height / 100) ** 2)).toFixed(1) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-cinzel text-xl text-yellow-400 mb-2">Group Members</h3>
                                    <div className="bg-black/20 p-4 rounded-lg space-y-3">
                                        {viewingUser.groupMemberDetails.length > 0 ? (viewingUser.groupMemberDetails.map(m => (
                                            <div key={m.id} className="grid grid-cols-3 gap-x-4 border-b border-white/10 last:border-b-0 pb-2">
                                               <p className="col-span-3"><span className="text-sm text-yellow-200/80">Name:</span><br/>{m.name}</p>
                                               <p><span className="text-sm text-yellow-200/80">Gender:</span><br/>{m.gender}</p>
                                               <p><span className="text-sm text-yellow-200/80">Age:</span><br/>{m.idType === 'passport' ? m.age : calculateAge(m.idNumber)}</p>
                                               <p><span className="text-sm text-yellow-200/80">{m.idType.toUpperCase()}:</span><br/>{m.idNumber}</p>
                                               <p><span className="text-sm text-yellow-200/80">Height:</span><br/>{m.height ? `${m.height} cm` : 'N/A'}</p>
                                               <p><span className="text-sm text-yellow-200/80">Weight:</span><br/>{m.weight ? `${m.weight} kg` : 'N/A'}</p>
                                               <p><span className="text-sm text-yellow-200/80">BMI:</span><br/>
                                                    {m.height && m.weight ? (m.weight / ((m.height / 100) ** 2)).toFixed(1) : 'N/A'}
                                                </p>
                                            </div>
                                        ))) : <p className="text-gray-400">No group members.</p>}
                                    </div>
                                </div>
                                 <div>
                                    <h3 className="font-cinzel text-xl text-yellow-400 mb-2 border-b border-yellow-300/20 pb-1">Live Activity</h3>
                                    {activity ? (
                                    <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-lg">
                                        <p><span className="text-sm text-yellow-200/80">Distance:</span><br/><span className="font-bold text-white">{(activity.distance / 1000).toFixed(2)} km</span></p>
                                        <p><span className="text-sm text-yellow-200/80">Calories:</span><br/><span className="font-bold text-white">{Math.round(activity.calories)} kcal</span></p>
                                        <p><span className="text-sm text-yellow-200/80">Moving Time:</span><br/><span className="font-bold text-white tabular-nums">{formatTime(activity.activeTime || 0)}</span></p>
                                        <p><span className="text-sm text-yellow-200/80">Rest Time:</span><br/><span className="font-bold text-white tabular-nums">{formatTime(activity.restTime || 0)}</span></p>
                                        <p><span className="text-sm text-yellow-200/80">Ascent:</span><br/><span className="font-bold text-white">{Math.round(activity.elevationGain)} m</span></p>
                                        <p><span className="text-sm text-yellow-200/80">Descent:</span><br/><span className="font-bold text-white">{Math.round(activity.elevationLoss || 0)} m</span></p>
                                    </div>
                                    ) : <p className="text-gray-400 text-center py-4">No activity data.</p>}
                                </div>
                            </div>
                            {/* Quest and Photos Section */}
                            <div className="space-y-4">
                                <h3 className="font-cinzel text-xl text-yellow-400 mb-2 border-b border-yellow-300/20 pb-1">Quest Progress</h3>
                                {viewingUser.role !== 'admin' && questState ? (
                                    <UserQuestProgress 
                                        questState={questState} 
                                        onUnlockTask={(taskIndex) => handleUnlockTask(viewingUser.username, taskIndex)} 
                                        onUnlockSubtask={(taskId, subtaskId) => handleUnlockSubtask(viewingUser.username, taskId, subtaskId)}
                                    />
                                ) : <p className="text-gray-400 text-center py-4">No quest data.</p>}
                                
                                <h3 className="font-cinzel text-xl text-yellow-400 mb-2 pt-2">Submitted Photos</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {assets.length > 0 ? (assets.map(asset => (
                                    <div key={asset.id} className="bg-black/30 p-2 rounded-lg flex gap-3 items-center">
                                        <img src={asset.imageDataUrl} alt="User asset" className="rounded-md w-20 h-20 object-cover" />
                                        <div className="text-xs text-gray-400 flex-grow">
                                            <p className="font-bold text-white/90">Task Photo</p>
                                            <p>Time: {new Date(asset.timestamp).toLocaleString()}</p>
                                            <p>Location: {asset.location ? `${asset.location.latitude.toFixed(4)}, ${asset.location.longitude.toFixed(4)}` : 'N/A'}</p>
                                        </div>
                                        <div className="flex flex-col gap-1.5 self-center">
                                            <button onClick={() => setViewingAsset(asset)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-2 rounded w-full">View</button>
                                            <a href={asset.imageDataUrl} download={`asset-${asset.userId}-${asset.subtaskId}.png`} className="text-center text-xs bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-2 rounded w-full">Download</a>
                                            <button 
                                                onClick={() => {
                                                    if (asset.location) {
                                                        window.open(`https://www.google.com/maps/search/?api=1&query=${asset.location.latitude},${asset.location.longitude}`, '_blank', 'noopener,noreferrer');
                                                    }
                                                }}
                                                disabled={!asset.location}
                                                className="text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-1 px-2 rounded w-full"
                                                title={!asset.location ? "Location data not available" : "Open in Google Maps"}
                                            >
                                                To Maps
                                            </button>
                                        </div>
                                    </div>
                                ))) : <p className="text-gray-400 text-center py-4">No photos submitted.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                    </>
                )}
            </ThemedModal>
            
            <ThemedModal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)}>
                <div>
                    <h2 className="font-cinzel text-3xl text-yellow-300 mb-4">Archived Users</h2>
                    <div className="space-y-2 overflow-y-auto pr-2">
                        {archivedUsers.length > 0 ? archivedUsers.map(user => (
                            <div key={user.username} className="p-2 rounded-lg flex justify-between items-center bg-white/10">
                                <div><p className="font-bold text-white">{user.firstName} {user.lastName}</p><p className="text-xs text-gray-400">{user.username}</p></div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRestoreUser(user)} className="text-xs bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-2 rounded">Restore</button>
                                    <button onClick={() => confirmPermanentDelete(user)} className="text-xs bg-red-800 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Delete Permanently</button>
                                </div>
                            </div>
                        )) : <p className="text-gray-400 text-center">The archive is empty.</p>}
                    </div>
                </div>
            </ThemedModal>

            <ThemedModal isOpen={confirmation.isOpen} onClose={() => setConfirmation({ ...confirmation, isOpen: false })}>
                 <div className="w-full h-full flex flex-col items-center justify-center text-center -mt-20">
                    <div className="max-w-3xl">
                        <h2 className="font-cinzel text-3xl sm:text-4xl text-yellow-300 mb-4">{confirmation.title}</h2>
                        <p className="text-gray-200 mb-8 text-lg">{confirmation.message}</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setConfirmation({ ...confirmation, isOpen: false })} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-md text-lg">Cancel</button>
                            <button onClick={confirmation.onConfirm} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-md text-lg">Confirm</button>
                        </div>
                    </div>
                </div>
            </ThemedModal>

            <ThemedModal isOpen={!!viewingAsset} onClose={() => setViewingAsset(null)}>
                {viewingAsset && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <h3 className="font-cinzel text-2xl text-yellow-300 pb-2 border-b border-yellow-300/20 mb-4">
                            Photo Asset
                        </h3>
                        <img src={viewingAsset.imageDataUrl} alt="User asset" className="rounded-md w-full max-h-[60vh] object-contain mb-4 bg-black/20" />
                    </div>
                )}
            </ThemedModal>

            {/* SOS Notification Modal */}
            <ThemedModal isOpen={!!sosNotification} onClose={() => { setSosNotification(null); audioService.stopSOSAlarmSound(); }}>
                {sosNotification && (
                     <div className="w-full h-full flex flex-col items-center justify-center text-center -mt-20 animate-pulse">
                        <div className="max-w-3xl border-4 border-red-500 p-8 rounded-2xl bg-black/50">
                            <h2 className="font-cinzel text-4xl sm:text-5xl text-red-500 mb-4">!!! SOS ALERT !!!</h2>
                            <p className="text-white mb-2 text-2xl">
                                <span className="font-bold">{sosNotification.firstName} {sosNotification.lastName}</span> (@{sosNotification.username}) needs help!
                            </p>
                            <p className="text-gray-300 mb-8 text-lg">
                                Alert received at: {new Date(sosNotification.timestamp).toLocaleTimeString()}
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => { setSosNotification(null); audioService.stopSOSAlarmSound(); }} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-md text-lg">Acknowledge</button>
                                <button onClick={() => { setActiveView('sos'); setSosNotification(null); audioService.stopSOSAlarmSound(); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-md text-lg">Go to Log</button>
                            </div>
                        </div>
                    </div>
                )}
            </ThemedModal>
        </div>
    );
};

export default AdminDashboard;