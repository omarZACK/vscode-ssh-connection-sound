const fs = require("fs");
const path = require("path");
const os = require("os");

function getPlatformKey() {
    switch (process.platform) {
        case "win32":
            return "windows";

        case "darwin":
            return "macos";

        default:
            return "linux";
    }
}

function expandPath(value) {
    if (!value || typeof value !== "string") {
        return value;
    }

    if (value === "~") {
        return os.homedir();
    }

    if (value.startsWith("~/")) {
        return path.join(os.homedir(), value.slice(2));
    }

    return value;
}

function resolveConfigPath(configuredPath, extensionPath) {
    if (!configuredPath || !configuredPath.trim()) {
        return path.join(extensionPath, "config", "sounds.json");
    }

    const expanded = expandPath(configuredPath.trim());

    if (path.isAbsolute(expanded)) {
        return expanded;
    }

    return path.resolve(expanded);
}

function validateEvent(eventName, eventConfig) {
    if (!eventConfig || typeof eventConfig !== "object") {
        return `Missing configuration for "${eventName}".`;
    }

    if (typeof eventConfig.type !== "string") {
        return `Invalid type for "${eventName}".`;
    }

    if (eventConfig.type === "system") {
        if (typeof eventConfig.sound !== "string" || !eventConfig.sound) {
            return `System sound "${eventName}" requires a sound name.`;
        }

        return null;
    }

    if (eventConfig.type === "file") {
        const hasPath =
            typeof eventConfig.path === "string" && eventConfig.path.length > 0;

        const hasPaths =
            Array.isArray(eventConfig.paths) &&
            eventConfig.paths.length > 0 &&
            eventConfig.paths.every(
                (item) => typeof item === "string" && item.length > 0,
            );

        if (!hasPath && !hasPaths) {
            return `File sound "${eventName}" requires "path" or "paths".`;
        }

        return null;
    }

    return `Unsupported sound type "${eventConfig.type}" for "${eventName}".`;
}

function validateSounds(parsed) {
    if (!parsed || typeof parsed !== "object") {
        return "sounds.json must contain a JSON object.";
    }

    const platform = getPlatformKey();

    if (!parsed[platform]) {
        return `sounds.json does not contain configuration for ${platform}.`;
    }

    const platformConfig = parsed[platform];

    for (const eventName of ["success", "failure", "disconnect"]) {
        const error = validateEvent(eventName, platformConfig[eventName]);

        if (error) {
            return error;
        }
    }

    return null;
}

function loadSounds({ extensionPath, getConfiguration }) {
    try {
        const configuredPath = getConfiguration().get("soundsFile", "");

        const configPath = resolveConfigPath(configuredPath, extensionPath);

        if (!fs.existsSync(configPath)) {
            throw new Error(`File does not exist: ${configPath}`);
        }

        const content = fs.readFileSync(configPath, "utf8");
        const parsed = JSON.parse(content);

        const validationError = validateSounds(parsed);

        if (validationError) {
            throw new Error(validationError);
        }

        console.log(`[SSH Connection Sound] Loaded sounds from: ${configPath}`);

        return {
            success: true,
            sounds: parsed,
            path: configPath,
        };
    } catch (error) {
        return {
            success: false,
            sounds: null,
            error: error.message,
        };
    }
}

module.exports = {
    getPlatformKey,
    expandPath,
    resolveConfigPath,
    validateSounds,
    loadSounds,
};
