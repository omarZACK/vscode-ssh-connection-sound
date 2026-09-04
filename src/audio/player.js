const windows = require("./windows");
const macos = require("./macos");
const linux = require("./linux");

class AudioPlayer {
    constructor({ getConfiguration }) {
        this.getConfiguration = getConfiguration;
        this.sounds = null;
    }

    setSounds(sounds) {
        this.sounds = sounds;
    }

    getPlatformKey() {
        if (process.platform === "win32") {
            return "windows";
        }

        if (process.platform === "darwin") {
            return "macos";
        }

        return "linux";
    }

    getSound(event) {
        if (!this.sounds) {
            return null;
        }

        const platform = this.getPlatformKey();

        return this.sounds?.[platform]?.[event] || null;
    }

    async play(event) {
        const enabled = this.getConfiguration().get("enabled", true);

        if (!enabled) {
            return;
        }

        const sound = this.getSound(event);

        if (!sound) {
            console.warn(
                `[SSH Connection Sound] No sound configured for event: ${event}`,
            );
            return;
        }

        try {
            switch (process.platform) {
                case "win32":
                    await windows.play(sound);
                    break;

                case "darwin":
                    await macos.play(sound);
                    break;

                default:
                    await linux.play(sound);
                    break;
            }

            console.log(`[SSH Connection Sound] Played ${event} sound.`);
        } catch (error) {
            console.error(
                `[SSH Connection Sound] Failed to play ${event} sound:`,
                error,
            );
        }
    }

    dispose() {
        this.sounds = null;
    }
}

module.exports = {
    AudioPlayer,
};
