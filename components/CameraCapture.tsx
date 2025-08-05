
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

interface CameraCaptureProps {
    onCapture: (data: { imageDataUrl: string; location: GeolocationCoordinates | null; } | 'skipped') => void;
    isCompleted: boolean;
}

const CameraIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        <path d="M14.066 9.934a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 12.586l3.293-3.293a1 1 0 011.414.07z" />
    </svg>
);

const SwitchCameraIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M15.312 11.242a5.5 5.5 0 01-9.13 4.256l.092-.086.092-.086 1.499-1.304a3.5 3.5 0 005.952-2.88l.006-.235H12.5a.75.75 0 010-1.5h3.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-1.138a5.501 5.501 0 01-1.438 1.488zM4.688 8.758a5.5 5.5 0 019.13-4.256l-.092.086-.092.086-1.499 1.304a3.5 3.5 0 00-5.952 2.88l-.006.235H7.5a.75.75 0 010 1.5H4a.75.75 0 01-.75-.75V5a.75.75 0 011.5 0v1.138A5.501 5.501 0 018.562 4.62z" clipRule="evenodd" />
    </svg>
);

const LoadingSpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CameraModal: React.FC<{
    onClose: () => void;
    onCapture: (data: { imageDataUrl: string; location: GeolocationCoordinates | null; } | 'skipped') => void;
}> = ({ onClose, onCapture }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [isUploading, setIsUploading] = useState(false);
    const [geotagError, setGeotagError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Effect to prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []); // Empty array ensures this runs on mount and cleans up on unmount

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);
    
    const startCamera = useCallback(async () => {
        if (stream) {
            stopCamera();
        }
        setError(null);
        setGeotagError(false);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
            setStream(mediaStream);
        } catch (err: any) {
            console.error("Camera access error:", err.message);
            setError("Camera access is required. Please allow permission and try again.");
        }
    }, [facingMode, stream, stopCamera]);
    
    useEffect(() => {
        startCamera();
    }, [facingMode]);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Video play error:", e));
        }
        return () => {
             if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const switchCamera = () => setFacingMode(prev => prev === 'user' ? 'environment' : 'user');

    const takePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                setCapturedImage(canvas.toDataURL('image/png'));
                stopCamera();
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };
    
    const handleConfirmUpload = () => {
        setIsUploading(true);
        setGeotagError(false);
        setError(null);
        if (!capturedImage) {
            setIsUploading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                onCapture({ imageDataUrl: capturedImage, location: position.coords });
            },
            (err) => {
                let errorMessage = `Upload Failed: Could not verify location. Error: ${err.message}.`;
                if (err.code === 1) errorMessage = "Upload Failed: Location permission denied.";
                else if (err.code === 2) errorMessage = "Upload Failed: Location is currently unavailable.";
                setError(errorMessage);
                setGeotagError(true);
                setIsUploading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };
    
    const handleContinueAnyway = () => {
        if(capturedImage) {
            onCapture({imageDataUrl: capturedImage, location: null});
        }
    }

    const renderContent = () => {
        if (capturedImage) {
            return (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <img src={capturedImage} alt="Captured preview" className="max-w-full max-h-full object-contain" />
                    <div className="absolute bottom-0 left-0 w-full bg-black/60 p-4 flex flex-col items-center justify-center gap-4">
                        {error && <p className="text-red-300 text-center">{error}</p>}
                        <div className="flex items-center justify-center gap-4">
                            {!geotagError ? (
                                <>
                                    <button onClick={handleRetake} disabled={isUploading} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">Retake</button>
                                    <button onClick={handleConfirmUpload} disabled={isUploading} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors flex items-center gap-2">
                                        {isUploading && <LoadingSpinnerIcon />}
                                        {isUploading ? 'Confirming...' : 'Confirm'}
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleContinueAnyway} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">Continue Anyway</button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="relative w-full h-full">
                {stream ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black flex items-center justify-center"><LoadingSpinnerIcon /></div>}
                {error && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-800/80 p-4 rounded-lg text-white">{error}</div>}

                <div className="absolute bottom-0 left-0 w-full bg-black/30 p-4 flex justify-center items-center">
                    <button onClick={takePhoto} disabled={!stream} className="h-20 w-20 bg-white rounded-full border-4 border-black/50 disabled:bg-gray-400"></button>
                </div>
                <button onClick={switchCamera} disabled={!stream} className="absolute top-4 right-4 bg-black/50 p-3 rounded-full text-white">
                    <SwitchCameraIcon />
                </button>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-fade-in">
            <button onClick={onClose} className="absolute top-4 left-4 text-white bg-black/50 rounded-full h-12 w-12 flex items-center justify-center text-2xl font-bold z-10">
                &times;
            </button>
            {renderContent()}
        </div>
    );
};

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, isCompleted }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (isCompleted) {
        return (
            <div className="flex items-center gap-2 text-green-400">
                <CameraIcon />
                <span>Photo Captured!</span>
            </div>
        );
    }
    
    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-1 px-3 rounded-md text-sm flex items-center"
            >
                <CameraIcon className="h-5 w-5 mr-2"/> Start Camera
            </button>
            {isModalOpen && ReactDOM.createPortal(
                <CameraModal 
                    onClose={() => setIsModalOpen(false)}
                    onCapture={(data) => {
                        onCapture(data);
                        setIsModalOpen(false);
                    }}
                />,
                document.body
            )}
        </>
    );
};

export default CameraCapture;
