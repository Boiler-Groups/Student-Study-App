import sound from "@/sounds/singleButtonPress.wav";

export function buttonPressSound() {
    return new Promise((resolve, reject) => {
        const audio = new Audio(sound);

        // Resolve when the sound ends
        audio.onended = resolve;

        // Reject if there's an error
        audio.onerror = reject;

        // Play the sound
        audio.play();
    });
}