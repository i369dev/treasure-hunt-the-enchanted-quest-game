// A simple service to manage and play sound effects throughout the application.
// This centralizes audio logic and makes it easy to manage sound assets.

const sounds = {
    // Corrected URLs to point directly to audio files.
    buttonClick: new Audio('https://pixabay.com/sound-effects/download/sound-6346.mp3'),
    subtaskComplete: new Audio('https://pixabay.com/sound-effects/download/sound-39735.mp3'),
    taskComplete: new Audio('https://pixabay.com/sound-effects/download/sound-110051.mp3'),
    sosAlarm: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-siren-loop-1025.mp3')
};

// Set volumes and preload for a better user experience
Object.values(sounds).forEach(sound => {
    sound.preload = 'auto';
});
sounds.buttonClick.volume = 0.4;
sounds.subtaskComplete.volume = 0.6;
sounds.taskComplete.volume = 0.7;
sounds.sosAlarm.volume = 0.8;
sounds.sosAlarm.loop = true; // SOS alarm should loop until acknowledged


/**
 * Plays a specified HTMLAudioElement.
 * It resets the audio's current time to 0 before playing,
 * which allows the sound to be re-triggered in quick succession.
 * @param {HTMLAudioElement} audio - The audio element to play.
 */
const playSound = (audio: HTMLAudioElement) => {
    audio.currentTime = 0;
    audio.play().catch(error => {
        // This error is expected if the user hasn't interacted with the page yet,
        // due to browser autoplay policies. We can safely ignore it.
        console.warn("Audio play was prevented by browser policy:", error.message);
    });
};

/**
 * Stops a specified HTMLAudioElement from playing.
 * @param {HTMLAudioElement} audio - The audio element to stop.
 */
const stopSound = (audio: HTMLAudioElement) => {
    audio.pause();
    audio.currentTime = 0;
};


export const audioService = {
    /**
     * Plays a subtle click sound for general button interactions.
     */
    playButtonClickSound: () => {
        playSound(sounds.buttonClick);
    },
    /**
     * Plays a positive, rewarding sound for completing a sub-task.
     */
    playSubtaskCompleteSound: () => {
        playSound(sounds.subtaskComplete);
    },
    /**
     * Plays a more significant, triumphant sound for completing a main task.
     */
    playTaskCompleteSound: () => {
        playSound(sounds.taskComplete);
    },
    /**
     * Plays a loud, looping alarm for an SOS event.
     */
    playSOSAlarmSound: () => {
        playSound(sounds.sosAlarm);
    },
    /**
     * Stops the looping SOS alarm.
     */
    stopSOSAlarmSound: () => {
        stopSound(sounds.sosAlarm);
    }
};