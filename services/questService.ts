import { app } from '../firebase-config';
import { getFirestore } from "firebase/firestore";
import { QuestState } from '../types';
import { getMasterQuest, initializeMasterQuest } from './masterQuestService';
import { resetActivityData } from './activityService';

const db = getFirestore(app);

const QUEST_STATE_KEY_PREFIX = 'treasure-quest-state-';

export const getQuestState = (username: string): QuestState | null => {
    const data = localStorage.getItem(`${QUEST_STATE_KEY_PREFIX}${username}`);
    return data ? JSON.parse(data) : null;
};

export const saveQuestState = (username:string, state: QuestState) => {
    localStorage.setItem(`${QUEST_STATE_KEY_PREFIX}${username}`, JSON.stringify(state));
};

export const createNewQuestState = (username: string): QuestState => {
    const masterQuest = initializeMasterQuest(); // Ensure master quest exists and get it
    
    // Deep clone the master quest and reset all progress for the new user session.
    const userQuest = JSON.parse(JSON.stringify(masterQuest));
    userQuest.tasks.forEach((task: any) => {
        task.isCompleted = false;
        if (task.subTasks) {
            task.subTasks.forEach((subTask: any) => {
                subTask.isCompleted = false;
            });
        }
    });
    
    const newState: QuestState = { quest: userQuest, currentTaskIndex: 0, notifications: [] };
    saveQuestState(username, newState);
    return newState;
}

export const resetQuestState = (username: string) => {
    localStorage.removeItem(`${QUEST_STATE_KEY_PREFIX}${username}`);
    // Also reset activity data when quest is reset
    resetActivityData(username);
};
