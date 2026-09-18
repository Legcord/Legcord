import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { serializeCapturerSources } from "../src/discord/screenshareSources.ts";

function fakeImage(dataUrl: string) {
    return {
        toDataURL: () => dataUrl,
        isEmpty: () => dataUrl.length === 0,
    };
}

describe("serializeCapturerSources", () => {
    it("gives each source a distinct usable image and keeps names", () => {
        const sources = [
            { id: "screen:0:0", name: "Entire screen", thumbnail: fakeImage("data:image/png;base64,SCREEN0") },
            { id: "window:11:0", name: "Jokel Comms DOD", thumbnail: fakeImage("data:image/png;base64,JOKEL") },
            { id: "window:22:0", name: "MSI Afterburner", thumbnail: fakeImage("data:image/png;base64,MSIAB") },
        ];

        const result = serializeCapturerSources(sources);
        assert.equal(result.length, 3);
        const images = result.map((source) => source.thumbnail);
        assert.equal(new Set(images).size, 3);
        for (const [index, source] of result.entries()) {
            assert.equal(source.id, sources[index].id);
            assert.equal(source.name, sources[index].name);
            assert.ok(source.thumbnail.startsWith("data:image/"), `expected data URL for ${source.name}`);
            assert.ok(source.thumbnail.length > "data:image/".length);
        }
    });

    it("uses a source-specific app icon when the thumbnail is missing", () => {
        const sources = [
            {
                id: "window:1:0",
                name: "Friends List",
                thumbnail: fakeImage(""),
                appIcon: fakeImage("data:image/png;base64,FRIENDICON"),
            },
            {
                id: "window:2:0",
                name: "Pull requests",
                thumbnail: fakeImage(""),
                appIcon: fakeImage("data:image/png;base64,PRICON"),
            },
        ];

        const result = serializeCapturerSources(sources);
        assert.equal(result[0].name, "Friends List");
        assert.equal(result[0].thumbnail, "data:image/png;base64,FRIENDICON");
        assert.equal(result[1].name, "Pull requests");
        assert.equal(result[1].thumbnail, "data:image/png;base64,PRICON");
        assert.notEqual(result[0].thumbnail, result[1].thumbnail);
    });

    it("does not reuse a duplicated compositor thumbnail across unrelated sources", () => {
        const sameFrame = "data:image/png;base64,SAMEFRAME";
        const sources = [
            { id: "screen:0:0", name: "Entire screen", thumbnail: fakeImage(sameFrame) },
            {
                id: "window:4432:0",
                name: "Jokel Comms DOD",
                thumbnail: fakeImage(sameFrame),
                appIcon: fakeImage("data:image/png;base64,JOKELICON"),
            },
            { id: "window:9:0", name: "Legcord Screen Share Low FP", thumbnail: fakeImage(sameFrame) },
        ];

        const result = serializeCapturerSources(sources);
        const images = result.map((source) => source.thumbnail);
        assert.equal(new Set(images).size, 3);
        assert.equal(result[1].thumbnail, "data:image/png;base64,JOKELICON");
        for (const source of result) {
            assert.ok(source.thumbnail.startsWith("data:image/"));
        }
    });
});
