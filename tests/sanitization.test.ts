import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import {
    DANGEROUS_CHROMIUM_SWITCHES,
    resolvePathUnderBaseDir,
    sanitizeAdditionalArguments,
} from "../src/common/sanitization.ts";

describe("resolvePathUnderBaseDir", () => {
    const base = path.resolve("/tmp/legcord-themes");

    it("resolves safe relative paths under the base", () => {
        const resolved = resolvePathUnderBaseDir(base, "MyTheme-BD");
        assert.equal(resolved, path.join(base, "MyTheme-BD"));
    });

    it("rejects parent-directory traversal", () => {
        assert.equal(resolvePathUnderBaseDir(base, "../settings.json"), null);
        assert.equal(resolvePathUnderBaseDir(base, "foo/../../etc/passwd"), null);
        assert.equal(resolvePathUnderBaseDir(base, ".."), null);
    });

    it("rejects absolute paths", () => {
        assert.equal(resolvePathUnderBaseDir(base, "/etc/passwd"), null);
    });

    it("rejects resolving to the base itself by default", () => {
        assert.equal(resolvePathUnderBaseDir(base, ""), null);
        assert.equal(resolvePathUnderBaseDir(base, "."), null);
    });

    it("allows the base when allowBase is set", () => {
        assert.equal(resolvePathUnderBaseDir(base, "", { allowBase: true }), base);
    });

    it("rejects null bytes", () => {
        assert.equal(resolvePathUnderBaseDir(base, "foo\0bar"), null);
    });
});

describe("sanitizeAdditionalArguments", () => {
    it("keeps benign switches", () => {
        assert.equal(
            sanitizeAdditionalArguments("--enable-features=Foo --disable-gpu"),
            "--enable-features=Foo --disable-gpu",
        );
    });

    it("strips proxy and certificate-bypass switches", () => {
        const input =
            "--proxy-server=http://evil.test:8080 --ignore-certificate-errors --enable-features=Bar --disable-web-security";
        assert.equal(sanitizeAdditionalArguments(input), "--enable-features=Bar");
    });

    it("strips every denylisted switch name", () => {
        for (const name of DANGEROUS_CHROMIUM_SWITCHES) {
            assert.equal(sanitizeAdditionalArguments(`--${name}=x`), "");
            assert.equal(sanitizeAdditionalArguments(`--${name}`), "");
        }
    });

    it("drops non-flag tokens", () => {
        assert.equal(sanitizeAdditionalArguments("not-a-flag --foo"), "--foo");
    });
});
