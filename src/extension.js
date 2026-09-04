const vscode = require("vscode");

const { loadSounds } = require("./config/loader");
const { AudioPlayer } = require("./audio/player");
const { RemoteMonitor } = require("./remote/monitor");

let audioPlayer = null;
let remoteMonitor = null;

function getConfiguration() {
    return vscode.workspace.getConfiguration("sshConnectionSound");
}

function isEnabled() {
    return getConfiguration().get("enabled", true);
}

function activate(context) {
    console.log("[SSH Connection Sound] Activating extension...");

    audioPlayer = new AudioPlayer({
        getConfiguration,
    });

    const soundsResult = loadSounds({
        extensionPath: context.extensionPath,
        getConfiguration,
    });

    if (!soundsResult.success) {
        console.error(
            "[SSH Connection Sound] Failed to load sound configuration:",
            soundsResult.error,
        );
    } else {
        audioPlayer.setSounds(soundsResult.sounds);
    }

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "sshConnectionSound.testSuccess",
            async () => {
                if (!isEnabled()) {
                    vscode.window.showInformationMessage(
                        "SSH Connection Sound is disabled.",
                    );
                    return;
                }

                await audioPlayer.play("success");
            },
        ),

        vscode.commands.registerCommand(
            "sshConnectionSound.testFailure",
            async () => {
                if (!isEnabled()) {
                    vscode.window.showInformationMessage(
                        "SSH Connection Sound is disabled.",
                    );
                    return;
                }

                await audioPlayer.play("failure");
            },
        ),

        vscode.commands.registerCommand(
            "sshConnectionSound.testDisconnect",
            async () => {
                if (!isEnabled()) {
                    vscode.window.showInformationMessage(
                        "SSH Connection Sound is disabled.",
                    );
                    return;
                }

                await audioPlayer.play("disconnect");
            },
        ),

        vscode.commands.registerCommand(
            "sshConnectionSound.reloadSounds",
            () => {
                const result = loadSounds({
                    extensionPath: context.extensionPath,
                    getConfiguration,
                });

                if (!result.success) {
                    vscode.window.showErrorMessage(
                        `SSH Connection Sound: failed to reload sounds. ${result.error}`,
                    );
                    return;
                }

                audioPlayer.setSounds(result.sounds);

                vscode.window.showInformationMessage(
                    "SSH Connection Sound: sounds reloaded.",
                );
            },
        ),
    );

    remoteMonitor = new RemoteMonitor({
        getConfiguration,
        onConnected: () => {
            if (isEnabled()) {
                audioPlayer.play("success");
            }
        },
        onDisconnected: () => {
            if (isEnabled()) {
                audioPlayer.play("disconnect");
            }
        },
    });

    remoteMonitor.start();

    context.subscriptions.push({
        dispose: () => {
            if (remoteMonitor) {
                remoteMonitor.dispose();
                remoteMonitor = null;
            }

            if (audioPlayer) {
                audioPlayer.dispose();
                audioPlayer = null;
            }
        },
    });

    console.log("[SSH Connection Sound] Extension activated.");
}

function deactivate() {
    if (remoteMonitor) {
        remoteMonitor.dispose();
        remoteMonitor = null;
    }

    if (audioPlayer) {
        audioPlayer.dispose();
        audioPlayer = null;
    }

    console.log("[SSH Connection Sound] Extension deactivated.");
}

module.exports = {
    activate,
    deactivate,
};
