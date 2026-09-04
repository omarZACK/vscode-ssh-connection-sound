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

function getCandidates(sound) {
    if (Array.isArray(sound.paths)) {
        return sound.paths;
    }

    if (typeof sound.path === "string") {
        return [sound.path];
    }

    return [];
}

function findExistingFile(sound) {
    const candidates = getCandidates(sound);

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

async function play(sound) {
    if (sound.type !== "file") {
        throw new Error(`Unsupported macOS sound type: ${sound.type}`);
    }

    const file = findExistingFile(sound);

    if (!file) {
        throw new Error(
            `No macOS sound file found. Checked: ${getCandidates(sound).join(
                ", ",
            )}`,
        );
    }

    await run("afplay", [file]);
}

module.exports = {
    play,
};
