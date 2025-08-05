import React, { useState, useRef } from 'react';

interface ScreenshotUploadProps {
    onUpload: (data: { imageDataUrl: string; location: null; }) => void;
    isCompleted: boolean;
}

const UploadIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);

const CheckCircleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const ScreenshotUpload: React.FC<ScreenshotUploadProps> = ({ onUpload, isCompleted }) => {
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.');
            return;
        }

        // Validate file size (e.g., 5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be under 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const imageDataUrl = reader.result as string;
            onUpload({ imageDataUrl, location: null });
        };
        reader.onerror = () => {
            setError('Failed to read file.');
        };
        reader.readAsDataURL(file);
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    if (isCompleted) {
        return (
            <div className="flex items-center gap-2 text-green-400">
                <CheckCircleIcon />
                <span>Upload Complete!</span>
            </div>
        );
    }
    
    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            <button 
                onClick={handleButtonClick} 
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 px-3 rounded-md text-sm flex items-center"
            >
                <UploadIcon className="h-5 w-5 mr-2"/> Upload Screenshot
            </button>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default ScreenshotUpload;
