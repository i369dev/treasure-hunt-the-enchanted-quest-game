import React, { useState, useEffect } from 'react';
import { Quest, Task, SubTask } from '../types';
import { getMasterQuest, initializeMasterQuest, updateMasterQuestAndPropagate } from '../services/masterQuestService';
import LoadingSpinner from './LoadingSpinner';

const QuestEditor: React.FC<{
    quest: Quest;
    onSave: (quest: Quest) => void;
    onCancel: () => void;
    isSaving: boolean;
}> = ({ quest: initialQuest, onSave, onCancel, isSaving }) => {
    const [quest, setQuest] = useState<Quest>(JSON.parse(JSON.stringify(initialQuest)));

    useEffect(() => {
        // When the initial quest from props changes (e.g., after a cancel), reset the form state
        setQuest(JSON.parse(JSON.stringify(initialQuest)));
    }, [initialQuest]);

    const handleFieldChange = (field: keyof Quest, value: string) => {
        setQuest(prev => ({ ...prev, [field]: value }));
    };

    const handleTaskChange = (taskIndex: number, field: keyof Task, value: string) => {
        setQuest(prev => {
            const newTasks = [...prev.tasks];
            newTasks[taskIndex] = { ...newTasks[taskIndex], [field]: value };
            return { ...prev, tasks: newTasks };
        });
    };
    
    const handleSubtaskChange = (taskIndex: number, subtaskIndex: number, field: keyof SubTask, value: any) => {
        setQuest(prev => {
            const newTasks = [...prev.tasks];
            const newSubtasks = [...newTasks[taskIndex].subTasks];
            newSubtasks[subtaskIndex] = { ...newSubtasks[subtaskIndex], [field]: value };
            newTasks[taskIndex] = { ...newTasks[taskIndex], subTasks: newSubtasks };
            return { ...prev, tasks: newTasks };
        });
    };

    const addTask = () => {
        const newTaskId = `task-${Date.now()}`;
        const newTask: Task = {
            id: newTaskId,
            title: 'New Task',
            riddle: '',
            isCompleted: false,
            subTasks: [],
        };
        setQuest(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    };

    const addSubtask = (taskIndex: number) => {
        const newSubtaskId = `subtask-${quest.tasks[taskIndex].id}-${Date.now()}`;
        const newSubtask: SubTask = {
            id: newSubtaskId,
            description: 'New sub-task',
            type: 'checkbox',
            isCompleted: false,
        };
        setQuest(prev => {
            const newTasks = [...prev.tasks];
            newTasks[taskIndex].subTasks.push(newSubtask);
            return { ...prev, tasks: newTasks };
        });
    };
    
    const removeTask = (taskIndex: number) => {
        setQuest(prev => ({...prev, tasks: prev.tasks.filter((_, i) => i !== taskIndex)}));
    };
    
    const removeSubtask = (taskIndex: number, subtaskIndex: number) => {
         setQuest(prev => {
            const newTasks = [...prev.tasks];
            newTasks[taskIndex].subTasks = newTasks[taskIndex].subTasks.filter((_, i) => i !== subtaskIndex);
            return { ...prev, tasks: newTasks };
        });
    };

    return (
        <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-yellow-300/20">
            <div className="mb-6 pb-4 border-b-2 border-yellow-300/30">
                 <h2 className="font-cinzel text-3xl text-yellow-300">Master Quest Editor</h2>
                 <p className="text-gray-400">Changes saved here will be sent to all users.</p>
            </div>
            
            <div className="space-y-4 mb-6">
                <input type="text" placeholder="Quest Title" value={quest.title} onChange={e => handleFieldChange('title', e.target.value)} className="w-full p-2 bg-white/10 rounded-md text-white text-lg" />
                <textarea placeholder="Quest Description" value={quest.description} onChange={e => handleFieldChange('description', e.target.value)} className="w-full p-2 bg-white/10 rounded-md text-white h-24" />
            </div>

            <div className="space-y-6">
                {quest.tasks.map((task, taskIndex) => (
                    <div key={task.id} className="p-4 bg-black/30 rounded-lg border border-yellow-200/10">
                        <div className="flex justify-between items-center mb-2">
                            <input type="text" placeholder="Task Title" value={task.title} onChange={e => handleTaskChange(taskIndex, 'title', e.target.value)} className="w-full p-2 bg-white/10 rounded-md text-white font-bold" />
                            <button onClick={() => removeTask(taskIndex)} className="text-red-500 hover:text-red-400 ml-4 font-bold text-2xl" title="Delete Task">&times;</button>
                        </div>
                         <textarea placeholder="Task Riddle" value={task.riddle} onChange={e => handleTaskChange(taskIndex, 'riddle', e.target.value)} className="w-full p-2 bg-white/10 rounded-md text-white italic h-20" />
                        
                        <div className="mt-4 space-y-3 pl-4 border-l-2 border-yellow-300/20">
                            <h4 className="text-yellow-200 font-semibold">Sub-Tasks:</h4>
                            {task.subTasks.map((subtask, subtaskIndex) => (
                                <div key={subtask.id} className="flex items-center gap-2">
                                    <input type="text" value={subtask.description} onChange={e => handleSubtaskChange(taskIndex, subtaskIndex, 'description', e.target.value)} className="flex-grow p-1 bg-white/10 rounded-md text-white" />
                                    <select value={subtask.type} onChange={e => handleSubtaskChange(taskIndex, subtaskIndex, 'type', e.target.value)} className="p-1 bg-white/10 rounded-md text-white">
                                        <option value="checkbox">Checkbox</option>
                                        <option value="photo">Photo</option>
                                        <option value="riddle">Riddle</option>
                                        <option value="screenshot_upload">Screenshot Upload</option>
                                    </select>
                                    {subtask.type === 'riddle' && (
                                        <input type="text" placeholder="Answer" value={subtask.riddleAnswer || ''} onChange={e => handleSubtaskChange(taskIndex, subtaskIndex, 'riddleAnswer', e.target.value)} className="p-1 bg-white/10 rounded-md text-white w-24" />
                                    )}
                                    <button onClick={() => removeSubtask(taskIndex, subtaskIndex)} className="text-red-500 hover:text-red-400 font-bold" title="Delete Sub-Task">&times;</button>
                                </div>
                            ))}
                            <button onClick={() => addSubtask(taskIndex)} className="text-sm bg-green-800/70 hover:bg-green-700 text-white py-1 px-3 rounded-md">+ Add Sub-Task</button>
                        </div>
                    </div>
                ))}
                <button onClick={addTask} className="w-full mt-4 bg-blue-800/70 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">+ Add Task</button>
            </div>

            <div className="flex justify-end gap-4 mt-8">
                <button onClick={onCancel} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed">
                    Discard Changes
                </button>
                <button onClick={() => onSave(quest)} disabled={isSaving} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-md transition-colors flex items-center justify-center w-48 disabled:bg-yellow-800 disabled:cursor-not-allowed">
                     {isSaving ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : (
                        'Save & Propagate'
                    )}
                </button>
            </div>
        </div>
    );
};

const MasterQuestManager: React.FC = () => {
    const [masterQuest, setMasterQuest] = useState<Quest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const loadQuest = () => {
        setIsLoading(true);
        const quest = initializeMasterQuest();
        setMasterQuest(quest);
        setIsLoading(false);
    };

    useEffect(() => {
        loadQuest();
    }, []);

    const handleSave = (quest: Quest) => {
        setIsSaving(true);
        setSaveSuccess(false);
        // Use a short timeout to make the saving feedback visible, as localStorage is synchronous
        setTimeout(() => {
            updateMasterQuestAndPropagate(quest);
            setMasterQuest(JSON.parse(JSON.stringify(quest))); // Deep copy to ensure child re-renders
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000); // Hide message after 4s
        }, 1000);
    };

    const handleCancel = () => {
        if (isSaving) return;
        // Reverting to the last saved state without confirmation.
        const reloadedQuest = getMasterQuest();
        setMasterQuest(reloadedQuest);
    }

    if (isLoading || !masterQuest) {
        return (
            <div className="text-center">
                <LoadingSpinner />
                <p className="font-cinzel mt-4 text-xl">Loading Master Quest...</p>
            </div>
        );
    }

    return (
        <div>
            {saveSuccess && (
                 <div className="bg-green-600 text-white font-bold p-3 rounded-lg mb-4 text-center animate-fade-in shadow-lg">
                    Quest updated and successfully propagated to all users!
                </div>
            )}
            <QuestEditor quest={masterQuest} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />
        </div>
    );
};

export default MasterQuestManager;