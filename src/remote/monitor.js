class RemoteMonitor {
    constructor({ getConfiguration, onConnected, onDisconnected }) {
        this.getConfiguration = getConfiguration;
        this.onConnected = onConnected;
        this.onDisconnected = onDisconnected;

        this.timer = null;
        this.lastRemoteName = undefined;
    }

    getPollInterval() {
        const configured = this.getConfiguration().get("pollInterval", 500);

        const numeric = Number(configured);

        if (!Number.isFinite(numeric)) {
            return 500;
        }

        return Math.max(100, numeric);
    }

    getCurrentRemoteName() {
        const vscode = require("vscode");

        return vscode.env.remoteName;
    }

    isSshRemote(remoteName) {
        return remoteName === "ssh-remote";
    }

    checkState() {
        const currentRemoteName = this.getCurrentRemoteName();

        if (this.lastRemoteName === undefined) {
            this.lastRemoteName = currentRemoteName;
            return;
        }

        if (currentRemoteName === this.lastRemoteName) {
            return;
        }

        const connected = this.isSshRemote(currentRemoteName);

        const disconnected =
            this.isSshRemote(this.lastRemoteName) && !currentRemoteName;

        if (connected) {
            console.log(
                "[SSH Connection Sound] Remote-SSH connection detected.",
            );

            if (typeof this.onConnected === "function") {
                this.onConnected();
            }
        }

        if (disconnected) {
            console.log(
                "[SSH Connection Sound] Remote-SSH disconnect detected.",
            );

            if (typeof this.onDisconnected === "function") {
                this.onDisconnected();
            }
        }

        this.lastRemoteName = currentRemoteName;
    }

    start() {
        if (this.timer) {
            return;
        }

        this.lastRemoteName = this.getCurrentRemoteName();

        const interval = this.getPollInterval();

        this.timer = setInterval(() => {
            this.checkState();
        }, interval);

        console.log(
            `[SSH Connection Sound] Remote monitor started (${interval} ms).`,
        );
    }

    dispose() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.lastRemoteName = undefined;

        console.log("[SSH Connection Sound] Remote monitor stopped.");
    }
}

module.exports = {
    RemoteMonitor,
};
