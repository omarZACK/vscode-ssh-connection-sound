const vscode = require("vscode");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

let pollTimer = null;
let previousWasSsh = false;
let previousRemoteName = undefined;
let lastFailureAt = 0;

let soundsConfig = null;

const FAILURE_COOLDOWN_MS = 3000;

/**
 * Get extension configuration.
 */
function getConfig() {
    return vscode.workspace.getConfiguration(
        "sshConnectionSound"
    );
}

/**
 * Check whether sounds are enabled.
 */
function isEnabled() {
    return getConfig().get("enabled", true);
}

/**
 * Detect Remote-SSH.
 */
function isSshRemote(remoteName) {
    return (
        typeof remoteName === "string" &&
        remoteName.startsWith("ssh-remote")
    );
}

/**
 * Execute a program safely.
 */
function run(command, args = []) {
    return new Promise((resolve) => {
        execFile(
            command,
            args,
            {
                windowsHide: true
            },
            (error) => {
                resolve(!error);
            }
        );
    });
}

/**
 * Check whether a command exists.
 */
async function commandExists(command) {
    if (process.platform === "win32") {
        return new Promise((resolve) => {
            execFile(
                "where.exe",
                [command],
                {
                    windowsHide: true
                },
                (error) => {
                    resolve(!error);
                }
            );
        });
    }

    return new Promise((resolve) => {
        execFile(
            "sh",
            [
                "-c",
                `command -v "${command}" >/dev/null 2>&1`
            ],
            (error) => {
                resolve(!error);
            }
        );
    });
}

/**
 * Determine the platform key used in sounds.json.
 */
function getPlatformKey() {
    switch (process.platform) {
        case "win32":
            return "windows";

        case "darwin":
            return "macos";

        case "linux":
            return "linux";

        default:
            return null;
    }
}

/**
 * Find the bundled sounds.json.
 */
function getBundledSoundsPath(context) {
    return path.join(
        context.extensionPath,
        "sounds.json"
    );
}

/**
 * Load sounds.json.
 *
 * If sshConnectionSound.soundsFile is configured,
 * that file takes priority.
 *
 * Otherwise the bundled sounds.json is used.
 */
function loadSoundsConfig(context) {
    const configuredPath = getConfig().get(
        "soundsFile",
        ""
    );

    let soundsPath = null;

    if (
        typeof configuredPath === "string" &&
        configuredPath.trim() !== ""
    ) {
        soundsPath = configuredPath.trim();

        /*
         * Allow paths such as:
         *
         * ~/sounds.json
         */
        if (
            soundsPath.startsWith("~/") ||
            soundsPath.startsWith("~\\")
        ) {
            const homeDirectory =
                process.env.HOME ||
                process.env.USERPROFILE ||
                "";

            soundsPath = path.join(
                homeDirectory,
                soundsPath.substring(2)
            );
        }

        /*
         * Relative custom paths are resolved against
         * the first workspace folder.
         */
        if (!path.isAbsolute(soundsPath)) {
            const workspacePath =
                vscode.workspace.workspaceFolders?.[0]
                    ?.uri.fsPath;

            soundsPath = path.resolve(
                workspacePath || process.cwd(),
                soundsPath
            );
        }
    } else {
        soundsPath =
            getBundledSoundsPath(context);
    }

    try {
        if (!fs.existsSync(soundsPath)) {
            throw new Error(
                `File not found: ${soundsPath}`
            );
        }

        const raw = fs.readFileSync(
            soundsPath,
            "utf8"
        );

        const parsed = JSON.parse(raw);

        validateSoundsConfig(parsed);

        soundsConfig = parsed;

        console.log(
            `[SSH Sound] Loaded sounds configuration: ${soundsPath}`
        );

        return true;
    } catch (error) {
        soundsConfig = null;

        console.error(
            `[SSH Sound] Failed to load sounds.json: ${error.message}`
        );

        vscode.window.showErrorMessage(
            `SSH Connection Sound: Could not load sounds.json. ${error.message}`
        );

        return false;
    }
}

/**
 * Validate the basic structure of sounds.json.
 */
function validateSoundsConfig(config) {
    if (
        !config ||
        typeof config !== "object"
    ) {
        throw new Error(
            "sounds.json must contain a JSON object."
        );
    }

    const platforms = [
        "windows",
        "macos",
        "linux"
    ];

    for (const platform of platforms) {
        if (
            config[platform] !== undefined &&
            typeof config[platform] !== "object"
        ) {
            throw new Error(
                `"${platform}" must be an object.`
            );
        }
    }
}

/**
 * Get sound definition for the current OS.
 */
function getSoundDefinition(type) {
    if (!soundsConfig) {
        return null;
    }

    const platform =
        getPlatformKey();

    if (!platform) {
        console.log(
            `[SSH Sound] Unsupported platform: ${process.platform}`
        );

        return null;
    }

    const platformConfig =
        soundsConfig[platform];

    if (
        !platformConfig ||
        typeof platformConfig !== "object"
    ) {
        console.log(
            `[SSH Sound] No configuration for platform: ${platform}`
        );

        return null;
    }

    const sound =
        platformConfig[type];

    if (
        !sound ||
        typeof sound !== "object"
    ) {
        console.log(
            `[SSH Sound] No "${type}" sound configured for ${platform}.`
        );

        return null;
    }

    return sound;
}

/**
 * Check whether a file exists.
 */
function fileExists(filePath) {
    try {
        return (
            typeof filePath === "string" &&
            filePath.length > 0 &&
            fs.existsSync(filePath)
        );
    } catch {
        return false;
    }
}

/**
 * Expand ~ in file paths.
 */
function expandHome(filePath) {
    if (
        typeof filePath !== "string"
    ) {
        return filePath;
    }

    if (
        filePath === "~"
    ) {
        return (
            process.env.HOME ||
            process.env.USERPROFILE ||
            filePath
        );
    }

    if (
        filePath.startsWith("~/") ||
        filePath.startsWith("~\\")
    ) {
        const homeDirectory =
            process.env.HOME ||
            process.env.USERPROFILE;

        if (homeDirectory) {
            return path.join(
                homeDirectory,
                filePath.substring(2)
            );
        }
    }

    return filePath;
}

/**
 * Resolve a sound file path.
 *
 * Relative paths are resolved against:
 *
 * 1. The directory containing sounds.json
 * 2. Workspace directory
 * 3. Current working directory
 */
function resolveSoundPath(soundPath) {
    if (
        typeof soundPath !== "string" ||
        soundPath.trim() === ""
    ) {
        return null;
    }

    soundPath =
        expandHome(soundPath.trim());

    if (path.isAbsolute(soundPath)) {
        return soundPath;
    }

    const configuredSoundsFile =
        getConfig().get(
            "soundsFile",
            ""
        );

    if (
        typeof configuredSoundsFile === "string" &&
        configuredSoundsFile.trim() !== ""
    ) {
        let configPath =
            expandHome(
                configuredSoundsFile.trim()
            );

        if (!path.isAbsolute(configPath)) {
            const workspacePath =
                vscode.workspace.workspaceFolders?.[0]
                    ?.uri.fsPath;

            configPath = path.resolve(
                workspacePath || process.cwd(),
                configPath
            );
        }

        return path.resolve(
            path.dirname(configPath),
            soundPath
        );
    }

    const workspacePath =
        vscode.workspace.workspaceFolders?.[0]
            ?.uri.fsPath;

    if (workspacePath) {
        const workspaceCandidate =
            path.resolve(
                workspacePath,
                soundPath
            );

        if (
            fileExists(workspaceCandidate)
        ) {
            return workspaceCandidate;
        }
    }

    return path.resolve(
        process.cwd(),
        soundPath
    );
}

/**
 * Play a file on Linux.
 */
async function playLinuxFile(filePath) {
    if (!fileExists(filePath)) {
        return false;
    }

    /*
     * PulseAudio / PipeWire PulseAudio compatibility.
     */
    if (
        await commandExists("paplay")
    ) {
        return run(
            "paplay",
            [filePath]
        );
    }

    /*
     * ALSA.
     */
    if (
        await commandExists("aplay")
    ) {
        return run(
            "aplay",
            [filePath]
        );
    }

    /*
     * FFmpeg.
     */
    if (
        await commandExists("ffplay")
    ) {
        return run(
            "ffplay",
            [
                "-nodisp",
                "-autoexit",
                "-loglevel",
                "quiet",
                filePath
            ]
        );
    }

    /*
     * libcanberra fallback.
     */
    if (
        await commandExists(
            "canberra-gtk-play"
        )
    ) {
        return run(
            "canberra-gtk-play",
            [
                "-f",
                filePath
            ]
        );
    }

    return false;
}

/**
 * Play a file on macOS.
 */
async function playMacFile(filePath) {
    if (!fileExists(filePath)) {
        return false;
    }

    if (
        await commandExists("afplay")
    ) {
        return run(
            "afplay",
            [filePath]
        );
    }

    return false;
}

/**
 * Play a WAV file on Windows.
 */
async function playWindowsFile(filePath) {
    if (!fileExists(filePath)) {
        return false;
    }

    /*
     * SoundPlayer is built into .NET / Windows.
     *
     * It supports WAV files.
     */
    if (
        !filePath
            .toLowerCase()
            .endsWith(".wav")
    ) {
        console.log(
            "[SSH Sound] Windows custom sound files must be WAV."
        );

        return false;
    }

    const escapedPath =
        filePath.replace(
            /'/g,
            "''"
        );

    const script =
        `(New-Object System.Media.SoundPlayer '${escapedPath}').PlaySync()`;

    if (
        await commandExists(
            "powershell.exe"
        )
    ) {
        return run(
            "powershell.exe",
            [
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                script
            ]
        );
    }

    return false;
}

/**
 * Play a native Windows system sound.
 */
async function playWindowsSystemSound(
    soundName
) {
    const allowedSounds = [
        "Asterisk",
        "Beep",
        "Exclamation",
        "Hand",
        "Question"
    ];

    if (
        !allowedSounds.includes(
            soundName
        )
    ) {
        console.log(
            `[SSH Sound] Invalid Windows system sound: ${soundName}`
        );

        return false;
    }

    const script =
        `[System.Media.SystemSounds]::${soundName}.PlaySync()`;

    if (
        await commandExists(
            "powershell.exe"
        )
    ) {
        return run(
            "powershell.exe",
            [
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                script
            ]
        );
    }

    return false;
}

/**
 * Play one configured sound.
 */
async function playSound(type) {
    if (!isEnabled()) {
        console.log(
            "[SSH Sound] Sounds are disabled."
        );

        return false;
    }

    if (!soundsConfig) {
        console.log(
            "[SSH Sound] sounds.json is not loaded."
        );

        return false;
    }

    const definition =
        getSoundDefinition(type);

    if (!definition) {
        return false;
    }

    const platform =
        getPlatformKey();

    /*
     * WINDOWS
     */
    if (
        platform === "windows"
    ) {
        /*
         * System sound.
         *
         * Example:
         *
         * {
         *   "type": "system",
         *   "sound": "Asterisk"
         * }
         */
        if (
            definition.type === "system"
        ) {
            return playWindowsSystemSound(
                definition.sound
            );
        }

        /*
         * File sound.
         */
        if (
            definition.type === "file"
        ) {
            const filePath =
                resolveSoundPath(
                    definition.path
                );

            return playWindowsFile(
                filePath
            );
        }

        return false;
    }

    /*
     * MACOS
     */
    if (
        platform === "macos"
    ) {
        if (
            definition.type !== "file"
        ) {
            console.log(
                "[SSH Sound] macOS currently expects type: file."
            );

            return false;
        }

        const filePath =
            resolveSoundPath(
                definition.path
            );

        return playMacFile(
            filePath
        );
    }

    /*
     * LINUX
     */
    if (
        platform === "linux"
    ) {
        if (
            definition.type !== "file"
        ) {
            console.log(
                "[SSH Sound] Linux currently expects type: file."
            );

            return false;
        }

        /*
         * Linux supports multiple fallback paths:
         *
         * "paths": [
         *   "/first/path.oga",
         *   "/second/path.oga"
         * ]
         */
        if (
            Array.isArray(
                definition.paths
            )
        ) {
            for (
                const configuredPath
                of definition.paths
            ) {
                const filePath =
                    resolveSoundPath(
                        configuredPath
                    );

                if (
                    !fileExists(filePath)
                ) {
                    continue;
                }

                const played =
                    await playLinuxFile(
                        filePath
                    );

                if (played) {
                    return true;
                }
            }

            return false;
        }

        /*
         * Also support a single:
         *
         * "path": "/path/to/file.oga"
         */
        if (
            typeof definition.path ===
            "string"
        ) {
            const filePath =
                resolveSoundPath(
                    definition.path
                );

            return playLinuxFile(
                filePath
            );
        }

        return false;
    }

    console.log(
        `[SSH Sound] Unsupported operating system: ${process.platform}`
    );

    return false;
}

/**
 * Detect an SSH failure.
 *
 * This is available for future integrations or
 * commands that provide Remote-SSH output.
 */
function playFailureOnce() {
    const now = Date.now();

    if (
        now - lastFailureAt <
        FAILURE_COOLDOWN_MS
    ) {
        return;
    }

    lastFailureAt = now;

    console.log(
        "[SSH Sound] SSH failure sound triggered."
    );

    void playSound("failure");
}

/**
 * Register test commands.
 */
function registerCommands(
    context
) {
    const testSuccess =
        vscode.commands.registerCommand(
            "sshConnectionSound.testSuccess",
            async () => {
                console.log(
                    "[SSH Sound] Testing success sound."
                );

                const played =
                    await playSound(
                        "success"
                    );

                if (played) {
                    vscode.window.showInformationMessage(
                        "SSH Connection Sound: success sound played."
                    );
                } else {
                    vscode.window.showWarningMessage(
                        "SSH Connection Sound: could not play the success sound."
                    );
                }
            }
        );

    const testFailure =
        vscode.commands.registerCommand(
            "sshConnectionSound.testFailure",
            async () => {
                console.log(
                    "[SSH Sound] Testing failure sound."
                );

                const played =
                    await playSound(
                        "failure"
                    );

                if (played) {
                    vscode.window.showInformationMessage(
                        "SSH Connection Sound: failure sound played."
                    );
                } else {
                    vscode.window.showWarningMessage(
                        "SSH Connection Sound: could not play the failure sound."
                    );
                }
            }
        );

    const testDisconnect =
        vscode.commands.registerCommand(
            "sshConnectionSound.testDisconnect",
            async () => {
                console.log(
                    "[SSH Sound] Testing disconnect sound."
                );

                const played =
                    await playSound(
                        "disconnect"
                    );

                if (played) {
                    vscode.window.showInformationMessage(
                        "SSH Connection Sound: disconnect sound played."
                    );
                } else {
                    vscode.window.showWarningMessage(
                        "SSH Connection Sound: could not play the disconnect sound."
                    );
                }
            }
        );

    const reloadSounds =
        vscode.commands.registerCommand(
            "sshConnectionSound.reloadSounds",
            () => {
                const loaded =
                    loadSoundsConfig(
                        context
                    );

                if (loaded) {
                    vscode.window.showInformationMessage(
                        "SSH Connection Sound: sounds.json reloaded."
                    );
                }
            }
        );

    context.subscriptions.push(
        testSuccess,
        testFailure,
        testDisconnect,
        reloadSounds
    );
}

/**
 * Monitor Remote-SSH state.
 */
function startRemoteMonitoring(
    context
) {
    previousRemoteName =
        vscode.env.remoteName;

    previousWasSsh =
        isSshRemote(
            previousRemoteName
        );

    const configuredInterval =
        Number(
            getConfig().get(
                "pollInterval",
                500
            )
        );

    const pollInterval =
        Number.isFinite(
            configuredInterval
        )
            ? Math.max(
                100,
                configuredInterval
            )
            : 500;

    pollTimer =
        setInterval(() => {
            const currentRemoteName =
                vscode.env.remoteName;

            const currentIsSsh =
                isSshRemote(
                    currentRemoteName
                );

            /*
             * Remote-SSH SUCCESS.
             */
            if (
                !previousWasSsh &&
                currentIsSsh
            ) {
                console.log(
                    `[SSH Sound] Remote-SSH connected: ${currentRemoteName}`
                );

                void playSound(
                    "success"
                );
            }

            /*
             * Remote-SSH DISCONNECT.
             */
            if (
                previousWasSsh &&
                !currentIsSsh
            ) {
                console.log(
                    "[SSH Sound] Remote-SSH disconnected."
                );

                void playSound(
                    "disconnect"
                );
            }

            previousRemoteName =
                currentRemoteName;

            previousWasSsh =
                currentIsSsh;
        }, pollInterval);

    context.subscriptions.push({
        dispose() {
            if (pollTimer) {
                clearInterval(
                    pollTimer
                );

                pollTimer = null;
            }
        }
    });

    console.log(
        `[SSH Sound] Remote-SSH monitoring started (${pollInterval} ms).`
    );
}

/**
 * Activate extension.
 */
function activate(context) {
    console.log(
        "[SSH Sound] Extension activated."
    );

    console.log(
        `[SSH Sound] Platform: ${process.platform}`
    );

    /*
     * Load sounds.json first.
     */
    loadSoundsConfig(
        context
    );

    /*
     * Register commands.
     */
    registerCommands(
        context
    );

    /*
     * Start SSH monitoring.
     */
    startRemoteMonitoring(
        context
    );
}

/**
 * Deactivate extension.
 */
function deactivate() {
    if (pollTimer) {
        clearInterval(
            pollTimer
        );

        pollTimer = null;
    }

    console.log(
        "[SSH Sound] Extension deactivated."
    );
}

module.exports = {
    activate,
    deactivate,
    playFailureOnce
};