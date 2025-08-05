
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';

interface Message {
    role: 'user' | 'model';
    content: string;
}

interface GeminiChatProps {
    isOpen: boolean;
    onClose: () => void;
}

const LeafIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.293 4.707a1 1 0 00-1.414 0L12 8.586l-2.293-2.293a1 1 0 00-1.414 1.414L10.586 10l-2.293 2.293a1 1 0 101.414 1.414L12 11.414l2.293 2.293a1 1 0 001.414-1.414L13.414 10l2.879-2.879a1 1 0 000-1.414z" />
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM3.464 3.464A7.96 7.96 0 0110 2v8H2a7.96 7.96 0 011.464-6.536z" />
    </svg>
);


const LoadingDots: React.FC = () => (
    <div className="flex space-x-1">
        <div className="w-2 h-2 bg-yellow-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-yellow-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-yellow-300 rounded-full animate-bounce"></div>
    </div>
);

const GeminiChat: React.FC<GeminiChatProps> = ({ isOpen, onClose }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Effect to prevent background scrolling when chat is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && !chat) {
            try {
                // Do not instantiate GoogleGenAI if the API key is missing
                if (!process.env.API_KEY) {
                    throw new Error("API_KEY environment variable not set.");
                }
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const chatSession = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: "You are a wise and ancient spirit of the enchanted forest, a mystical guide for an adventurer on a treasure hunt. Your name is Sylva. Speak in a slightly archaic, magical, and helpful tone. Keep your responses concise and mysterious, offering hints but never the direct answer.",
                    },
                });
                setChat(chatSession);
                if (messages.length === 0) {
                    setMessages([{ role: 'model', content: "Greetings, traveler. I am Sylva, the spirit of this wood. What guidance do you seek on your quest?" }]);
                }
            } catch (e: any) {
                console.error("Failed to initialize chat:", e);
                setError("The ancient spirits are silent at the moment. The API_KEY may be missing or invalid.");
            }
        }
    }, [isOpen, chat, messages.length]);

    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const stream = await chat.sendMessageStream({ message: input });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = modelResponse;
                    return newMessages;
                });
            }
        } catch (e: any) {
            console.error("Gemini API error:", e);
            const errorMessage = "A mysterious force is blocking my sight. I cannot answer now.";
            setError(errorMessage);
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length -1].role === 'model' && newMessages[newMessages.length -1].content === '') {
                     newMessages[newMessages.length -1].content = errorMessage;
                } else {
                    newMessages.push({ role: 'model', content: errorMessage });
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="relative bg-gray-900/80 backdrop-blur-xl border-2 border-yellow-400/30 rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-yellow-300/20">
                    <h2 className="font-cinzel text-2xl text-yellow-300">Whispers of the Forest</h2>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors" aria-label="Close chat">&times;</button>
                </header>

                <div className="flex-grow p-4 overflow-y-auto space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center"><LeafIcon/></div>}
                            <div className={`max-w-md lg:max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-900/60 text-white self-end' : 'bg-black/40 text-gray-200 self-start'}`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                {error && <p className="text-red-400 text-sm px-4 pb-2 text-center">{error}</p>}

                <form onSubmit={handleSend} className="p-4 border-t border-yellow-300/20 flex items-center gap-3">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        placeholder="Ask for guidance..."
                        disabled={isLoading || !chat}
                        rows={1}
                        className="flex-grow bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:ring-yellow-400 focus:border-yellow-400 transition resize-none disabled:opacity-50"
                    />
                    <button type="submit" disabled={isLoading || !chat || !input.trim()} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed h-10 flex items-center justify-center">
                        {isLoading ? <LoadingDots /> : "Send"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GeminiChat;
