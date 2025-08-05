
import React, { useState, useEffect } from 'react';
import { Task, SubTask, UnlockNotification } from '../types';
import CameraCapture from './CameraCapture';
import ScreenshotUpload from './ScreenshotUpload';

interface TaskCardProps {
    task: Task;
    onCompleteSubtask: (taskId: string, subtaskId: string, data: boolean | 'skipped' | { imageDataUrl: string; location: GeolocationCoordinates | null; }) => void;
    onCompleteTask: () => void;
    onRequestUnlock: (task: Task, subtask: SubTask) => void;
    notifications?: UnlockNotification[];
    onDismissNotification: (notificationId: string) => void;
}

const RiddleSubtask: React.FC<{ subtask: SubTask, onComplete: (isCorrect: boolean) => void }> = ({ subtask, onComplete }) => {
    const [answer, setAnswer] = useState('');
    const [isCorrect, setIsCorrect] = useState(false);

    const checkAnswer = () => {
        const correct = answer.trim().toLowerCase() === subtask.riddleAnswer?.toLowerCase();
        setIsCorrect(correct);
        onComplete(correct);
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <input 
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer..."
                disabled={isCorrect}
                className={`w-full sm:w-auto flex-grow bg-white/10 border ${isCorrect ? 'border-green-500' : 'border-white/20'} rounded-md p-2 text-white focus:ring-yellow-400 focus:border-yellow-400 transition`}
            />
            <button
                onClick={checkAnswer}
                disabled={isCorrect || !answer}
                className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300"
            >
                {isCorrect ? 'Correct!' : 'Submit'}
            </button>
        </div>
    );
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onCompleteSubtask, onCompleteTask, onRequestUnlock, notifications, onDismissNotification }) => {
    const [hasCamera, setHasCamera] = useState<boolean | null>(null);

    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    setHasCamera(devices.some(device => device.kind === 'videoinput'));
                })
                .catch(() => setHasCamera(false));
        } else {
            setHasCamera(false);
        }
    }, []);
    
    const areAllSubtasksCompleted = task.subTasks.every(st => st.isCompleted);

    const renderSubtask = (subtask: SubTask) => {
        const handleCompletion = (data: boolean | 'skipped' | { imageDataUrl: string; location: GeolocationCoordinates | null; }) => {
            onCompleteSubtask(task.id, subtask.id, data);
        };
        
        switch (subtask.type) {
            case 'checkbox':
                return (
                    <input 
                        type="checkbox"
                        checked={subtask.isCompleted}
                        onChange={(e) => handleCompletion(e.target.checked)}
                        className="h-6 w-6 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 bg-white/20"
                    />
                );
            case 'photo':
                 if (hasCamera === null) {
                    return <span className="text-xs text-gray-400">Checking for camera...</span>;
                }
                if (!hasCamera) {
                    return (
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-red-400">No camera detected.</span>
                             {!subtask.isCompleted && (
                                <button
                                    onClick={() => handleCompletion('skipped')}
                                    className="bg-gray-500 hover:bg-gray-400 text-white font-bold py-1 px-2 rounded-md text-sm"
                                >
                                    Skip
                                </button>
                             )}
                        </div>
                    );
                }
                return <CameraCapture onCapture={handleCompletion} isCompleted={subtask.isCompleted} />;
            case 'screenshot_upload':
                return <ScreenshotUpload onUpload={handleCompletion} isCompleted={subtask.isCompleted} />;
            case 'riddle':
                return <RiddleSubtask subtask={subtask} onComplete={handleCompletion} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-black/40 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg border border-yellow-300/20">
            <h3 className="font-cinzel text-3xl text-yellow-300 mb-2">{task.title}</h3>
            <p className="text-gray-300 italic mb-6 text-lg">"{task.riddle}"</p>
            
            <div className="space-y-4">
                {task.subTasks.map(subtask => {
                    const notification = notifications?.find(n => n.subtaskId === subtask.id);
                    return (
                    <div key={subtask.id} className={`p-4 rounded-lg transition-all duration-300 ${subtask.isCompleted ? 'bg-green-900/50' : 'bg-white/10'}`}>
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">{renderSubtask(subtask)}</div>
                            <p className={`flex-grow ${subtask.isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>
                                {subtask.description}
                            </p>
                            {!subtask.isCompleted && (
                                <button
                                    onClick={() => onRequestUnlock(task, subtask)}
                                    className="ml-auto flex-shrink-0 bg-yellow-800/80 hover:bg-yellow-700 text-yellow-200 text-xs font-bold py-1 px-3 rounded-full transition-colors"
                                    title="Request help from an admin"
                                    aria-label={`Request unlock for ${subtask.description}`}
                                >
                                    Help?
                                </button>
                            )}
                        </div>
                        {notification && (
                             <div className={`mt-3 p-3 rounded-lg text-sm flex items-start justify-between gap-2 animate-fade-in ${notification.type === 'approved' ? 'bg-green-800/50 border border-green-600/50' : 'bg-red-800/50 border border-red-600/50'}`}>
                                <p className={`flex-grow ${notification.type === 'approved' ? 'text-green-200' : 'text-red-200'}`}>{notification.message}</p>
                                <button
                                    onClick={() => onDismissNotification(notification.id)}
                                    className="text-white/70 hover:text-white font-bold text-xl leading-none flex-shrink-0 -mt-1"
                                    aria-label="Dismiss notification"
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                    </div>
                )})}
            </div>

            <button
                data-no-sound="true"
                onClick={onCompleteTask}
                disabled={!areAllSubtasksCompleted}
                className="mt-8 w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-xl py-3 px-4 rounded-lg transition-all duration-300 shadow-lg transform hover:scale-105 disabled:scale-100"
            >
                {areAllSubtasksCompleted ? 'Complete Task' : 'Complete All Sub-tasks to Proceed'}
            </button>
        </div>
    );
};

export default TaskCard;