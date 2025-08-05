import { Quest, QuestState, Task, SubTask } from '../types';
import { getUsers } from './userService';
import { getQuestState, saveQuestState } from './questService';

const MASTER_QUEST_KEY = 'treasure-hunt-master-quest';

const DEFAULT_MASTER_QUEST: Quest = {
    id: `master-quest-static-default`,
    title: "The Silent Forest's Secret",
    description: "A mysterious silence has fallen over the once-lively forest. Uncover the secrets hidden within its ancient heart. This is a default quest template for the administrator to edit.",
    tasks: [
        {
            id: 'task-default-1',
            title: "The Whispering Leaves",
            riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
            isCompleted: false,
            subTasks: [
                {
                    id: 'subtask-default-1-1',
                    description: 'Find a tree with whispering leaves and mark it as found.',
                    type: 'checkbox',
                    isCompleted: false,
                },
                {
                    id: 'subtask-default-1-2',
                    description: 'Solve the riddle of the wind.',
                    type: 'riddle',
                    riddleAnswer: 'An echo',
                    isCompleted: false,
                }
            ]
        },
        {
            id: 'task-default-2',
            title: "The Sunken Stone",
            riddle: "Find a stone that weeps by the river's edge, marked with the symbol of a crescent moon.",
            isCompleted: false,
            subTasks: [
                {
                    id: 'subtask-default-2-1',
                    description: 'Take a photo of the crescent moon symbol on the stone.',
                    type: 'photo',
                    isCompleted: false,
                },
                 {
                    id: 'subtask-default-2-2',
                    description: 'Confirm you have found the sunken stone.',
                    type: 'checkbox',
                    isCompleted: false,
                }
            ]
        },
    ]
};


export const getMasterQuest = (): Quest | null => {
    const data = localStorage.getItem(MASTER_QUEST_KEY);
    return data ? JSON.parse(data) : null;
};

export const saveMasterQuest = (quest: Quest): void => {
    localStorage.setItem(MASTER_QUEST_KEY, JSON.stringify(quest));
};

export const initializeMasterQuest = (): Quest => {
    let quest = getMasterQuest();
    if (!quest) {
        console.log("No master quest found. Creating a default static quest template...");
        quest = DEFAULT_MASTER_QUEST;
        saveMasterQuest(quest);
        console.log("Default master quest template saved.");
    }
    return quest;
};

export const updateMasterQuestAndPropagate = (updatedMasterQuest: Quest): void => {
    // 1. Save the master quest template
    saveMasterQuest(updatedMasterQuest);

    // 2. Propagate changes to all users
    const allUsers = getUsers();
    for (const user of allUsers) {
        // Admins do not have quest states
        if (user.role === 'admin') continue;

        let userQuestState = getQuestState(user.username);

        // If user has no quest yet, create a fresh one for them.
        if (!userQuestState) {
            const userQuest = JSON.parse(JSON.stringify(updatedMasterQuest)); // Deep clone
            userQuest.tasks.forEach((task: Task) => {
                task.isCompleted = false;
                task.subTasks?.forEach((subTask: SubTask) => {
                    subTask.isCompleted = false;
                });
            });
            const newState: QuestState = { quest: userQuest, currentTaskIndex: 0 };
            saveQuestState(user.username, newState);
            continue; // Move to the next user
        }

        // User has an existing quest, so synchronize it.
        const oldUserQuest = userQuestState.quest;
        const syncedTasks: Task[] = [];

        for (const masterTask of updatedMasterQuest.tasks) {
            const oldUserTask = oldUserQuest.tasks.find(t => t.id === masterTask.id);

            if (oldUserTask) { // Task exists, update it but preserve progress.
                const syncedSubTasks: SubTask[] = masterTask.subTasks.map(masterSubTask => {
                    const oldUserSubTask = oldUserTask.subTasks.find(st => st.id === masterSubTask.id);
                    return {
                        ...masterSubTask,
                        isCompleted: oldUserSubTask ? oldUserSubTask.isCompleted : false,
                    };
                });

                syncedTasks.push({
                    ...masterTask,
                    subTasks: syncedSubTasks,
                    isCompleted: oldUserTask.isCompleted,
                });
            } else { // This is a new task, add it without progress.
                const newTask = JSON.parse(JSON.stringify(masterTask));
                newTask.isCompleted = false;
                newTask.subTasks.forEach((st: SubTask) => st.isCompleted = false);
                syncedTasks.push(newTask);
            }
        }
        
        userQuestState.quest.title = updatedMasterQuest.title;
        userQuestState.quest.description = updatedMasterQuest.description;
        userQuestState.quest.tasks = syncedTasks;

        // Ensure currentTaskIndex is valid.
        const firstIncompleteIndex = syncedTasks.findIndex(t => !t.isCompleted);
        const newIndex = firstIncompleteIndex === -1 ? syncedTasks.length : firstIncompleteIndex;
        
        // Only move the user's progress forward or keep it if their current task still exists.
        // Avoids jarringly moving a user backward.
        const currentUserTaskStillExists = userQuestState.currentTaskIndex < syncedTasks.length && 
                                           oldUserQuest.tasks.find(t => t.id === syncedTasks[userQuestState.currentTaskIndex]?.id);

        if (!currentUserTaskStillExists) {
             userQuestState.currentTaskIndex = newIndex;
        } else if (userQuestState.currentTaskIndex >= syncedTasks.length) {
             userQuestState.currentTaskIndex = newIndex;
        }

        saveQuestState(user.username, userQuestState);
    }
};