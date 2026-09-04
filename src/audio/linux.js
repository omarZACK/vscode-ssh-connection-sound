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

function commandExists(command) {
    return new Promise((resolve) => {
        execFile(
            "which",
            [command],
            {
                windowsHide: true,
            },
            (error) => {
                resolve(!error);
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

async function playWithPaplay(file) {
    await run("paplay", [file]);
}

async function playWithAplay(file) {
    await run("aplay", [file]);
}

async function playWithFfplay(file) {
    await run("ffplay", ["-nodisp", "-autoexit", "-loglevel", "quiet", file]);
}

async function playWithCanberra(file) {
    await run("canberra-gtk-play", ["-f", file]);
}

async function play(sound) {
    if (sound.type !== "file") {
        throw new Error(`Unsupported Linux sound type: ${sound.type}`);
    }

    const file = findExistingFile(sound);

    if (!file) {
        throw new Error(
            `No Linux sound file found. Checked: ${getCandidates(sound).join(
                ", ",
            )}`,
        );
    }

    if (await commandExists("paplay")) {
        await playWithPaplay(file);
        return;
    }

    if (await commandExists("aplay")) {
        await playWithAplay(file);
        return;
    }

    if (await commandExists("ffplay")) {
        await playWithFfplay(file);
        return;
    }

    if (await commandExists("canberra-gtk-play")) {
        await playWithCanberra(file);
        return;
    }

    throw new Error(
        "No supported Linux audio player was found. Install paplay, aplay, ffplay, or canberra-gtk-play.",
    );
}

module.exports = {
    play,
};
