
import React from 'react';

interface QuestCompletionProps {
    questTitle: string;
    onRestart: () => void;
}

const QuestCompletion: React.FC<QuestCompletionProps> = ({ questTitle, onRestart }) => {
    return (
        <div className="text-center bg-black/50 backdrop-blur-lg p-8 sm:p-12 rounded-2xl shadow-2xl border-2 border-yellow-400/50 max-w-2xl mx-auto animate-fade-in">
            <h2 className="font-cinzel text-3xl sm:text-4xl text-yellow-300 font-bold mb-4">Congratulations!</h2>
            <p className="text-lg sm:text-xl text-gray-200 mb-2">
                You have bravely navigated the enchanted woods and completed
            </p>
            <p className="font-cinzel text-2xl text-yellow-400 mb-8">{questTitle}</p>
            <p className="text-gray-300 mb-8">The spirits of the forest are grateful for your courage and wisdom. A new legend is born today!</p>
            <button
                onClick={onRestart}
                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg transform hover:scale-105"
            >
                Begin a New Quest
            </button>
        </div>
    );
};

export default QuestCompletion;
