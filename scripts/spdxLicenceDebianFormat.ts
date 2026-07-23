// https://www.debian.org/doc/debian-policy/ch-docs.html#copyright-information
// https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import spdxLicenseList from "spdx-license-list";

interface CopyrightConfig {
    upstreamName: string;
    source: string;
    copyrightHolder: string;
    licenseId: string;
    comment: string; // optional but nice to have
}

function indentText(text: string): string {
    // formatted text fields follow the same rules as Debian control file
    // long descriptions: each line indented with a single space, blank
    // lines represented as " ."
    return text
        .split("\n")
        .map((line) => (line.trim() === "" ? " ." : ` ${line}`))
        .join("\n");
}

function generateCopyrightFile(config: CopyrightConfig): string {
    const license = spdxLicenseList[config.licenseId];
    if (!license) {
        throw new Error(`Unknown SPDX license id: ${config.licenseId}`);
    }

    const header = [
        "Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/",
        `Upstream-Name: ${config.upstreamName}`,
        `Source: ${config.source}`,
        `Comment: ${indentText(config.comment)}`, // optional field
    ].join("\n");

    const licenseText = readFileSync("license.txt").toString();

    const licenseStanza = [`License: ${config.licenseId}`, indentText(licenseText)].join("\n");

    const filesStanza = ["Files: *", `Copyright: ${config.copyrightHolder}`, `License: ${config.licenseId}`].join("\n");

    return `${[header, filesStanza, licenseStanza].join("\n\n")}\n`;
}

/**
 * Returns the Debian SPDX-formatted license for given license ID
 *
 * @export
 * @return {*}  {string}
 */
export default function (): string {
    const copyrightContent: string = generateCopyrightFile({
        upstreamName: "Legcord",
        source: "https://github.com/Legcord/Legcord",
        copyrightHolder: `2020 - ${new Date().getFullYear()} Legcord Contributors`, // git log --reverse
        licenseId: "OSL-3.0",
        comment: "Open-Source Discord client alternative.",
    });

    const licensePath = path.join(__dirname, "spdx-license.txt");
    writeFileSync(licensePath, copyrightContent);
    return licensePath;
}
