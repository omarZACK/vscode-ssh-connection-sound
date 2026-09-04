const fs = require("fs");
const { execFile } = require("child_process");

function run(command, args) {
    return new Promise((resolve, reject) => {
        execFile(
            command,
            args,
            {
                windowsHide: true,
            },
            (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve({
                    stdout,
                    stderr,
                });
            },
        );
    });
}

function sanitizeSystemSoundName(name) {
    return String(name).replace(/[^A-Za-z]/g, "");
}

async function playSystemSound(name) {
    const safeName = sanitizeSystemSoundName(name);

    if (!safeName) {
        throw new Error("Invalid Windows system sound name.");
    }

    const script = `[System.Media.SystemSounds]::${safeName}.Play()`;

    await run("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        script,
    ]);
}

async function playFile(soundPath) {
    if (!fs.existsSync(soundPath)) {
        throw new Error(`Sound file does not exist: ${soundPath}`);
    }

    const escapedPath = soundPath.replace(/'/g, "''");

    const script = `(New-Object System.Media.SoundPlayer '${escapedPath}').PlaySync()`;

    await run("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        script,
    ]);
}

async function play(sound) {
    if (sound.type === "system") {
        await playSystemSound(sound.sound);
        return;
    }

    if (sound.type === "file") {
        const soundPath = sound.path;

        if (!soundPath) {
            throw new Error('Windows file sound requires a "path" property.');
        }

        await playFile(soundPath);
        return;
    }

    throw new Error(`Unsupported Windows sound type: ${sound.type}`);
}

module.exports = {
    play,
    playSystemSound,
    playFile,
};
