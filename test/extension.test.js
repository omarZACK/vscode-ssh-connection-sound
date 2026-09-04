const test = require("node:test");
const assert = require("node:assert/strict");

const { expandPath, validateSounds } = require("../src/config/loader");

test("expandPath leaves absolute paths unchanged", () => {
    const input = "/tmp/test/sounds.json";

    assert.equal(expandPath(input), input);
});

test("expandPath expands home directory", () => {
    const result = expandPath("~/sounds.json");

    assert.ok(result.endsWith("/sounds.json"));
});

test("validateSounds rejects missing platform configuration", () => {
    const result = validateSounds({});

    assert.ok(result);
});

test("validateSounds accepts valid Linux configuration", () => {
    const sounds = {
        linux: {
            success: {
                type: "file",
                paths: ["/tmp/success.oga"],
            },
            failure: {
                type: "file",
                paths: ["/tmp/failure.oga"],
            },
            disconnect: {
                type: "file",
                paths: ["/tmp/disconnect.oga"],
            },
        },
    };

    assert.equal(validateSounds(sounds), null);
});
