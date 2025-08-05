import React from 'react';
import { QuestState } from '../types';

interface UserQuestProgressProps {
    questState: QuestState;
    onUnlockTask: (taskIndex: number) => void;
    onUnlockSubtask: (taskId: string, subtaskId: string) => void;
}

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v2H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V8a2 2 0 00-2-2h-1V4a2 2 0 00-2-2zm-1 4V4a1 1 0 011-1h0a1 1 0 011 1v2H9z" clipRule="evenodd" />
    </svg>
);

const CompassIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 6.332a6 6 0 118.485 8.485A6 6 0 014.332 6.332zM10 4a1 1 0 100 2 1 1 0 000-2zm0 10a1 1 0 100 2 1 1 0 000-2zM7 7a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>
);


const UserQuestProgress: React.FC<UserQuestProgressProps> = ({ questState, onUnlockTask, onUnlockSubtask }) => {
    const { quest, currentTaskIndex } = questState;
    return (
        <div className="bg-black/20 p-4 rounded-lg space-y-4">
            {quest.tasks.map((task, index) => {
                const isCompleted = index < currentTaskIndex;
                const isCurrent = index === currentTaskIndex;
                const isLocked = index > currentTaskIndex;

                let statusStyles = 'bg-gray-700/50 text-gray-400';
                let icon = <LockIcon />;
                if (isCompleted) {
                    statusStyles = 'bg-green-800/60 text-green-300';
                    icon = <CheckIcon />;
                } else if (isCurrent) {
                    statusStyles = 'bg-yellow-600/70 text-yellow-200 ring-1 ring-yellow-400';
                    icon = <CompassIcon />;
                }

                return (
                    <div key={task.id} className="p-2 bg-black/20 rounded-lg">
                        <div className="flex items-center space-x-4">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${statusStyles} transition-all duration-300`}>
                                {icon}
                            </div>
                            <span className={`font-semibold ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                                {task.title}
                            </span>
                            {isLocked && (
                                <button
                                    onClick={() => onUnlockTask(index)}
                                    className="ml-auto bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors"
                                    aria-label={`Unlock ${task.title}`}
                                >
                                    Unlock Task
                                </button>
                            )}
                        </div>
                        {/* Render sub-tasks only for current and completed tasks for clarity */}
                        {(!isLocked) && (
                            <div className="mt-2 pl-6 space-y-2 border-l-2 border-gray-700 ml-6">
                                {task.subTasks.map(subtask => (
                                    <div key={subtask.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            {subtask.isCompleted ? <CheckIcon /> : <div className="w-5 h-5" />}
                                            <p className={subtask.isCompleted ? 'text-gray-400 line-through' : 'text-gray-200'}>
                                                {subtask.description}
                                            </p>
                                        </div>
                                        {!subtask.isCompleted && (
                                            <button
                                                onClick={() => onUnlockSubtask(task.id, subtask.id)}
                                                className="ml-auto bg-yellow-700/80 hover:bg-yellow-600 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors"
                                                aria-label={`Unlock sub-task: ${subtask.description}`}
                                            >
                                                Unlock
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default UserQuestProgress;