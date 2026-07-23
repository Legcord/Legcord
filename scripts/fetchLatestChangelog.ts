import fs from "node:fs";
import path from "node:path";

async function fetchLatestReleaseNotes(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/Legcord/Legcord/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'electron-builder-config-script'
        }
      }
    );

    if (!res.ok) {
      console.warn(`GitHub API returned ${res.status}, skipping changelog fetch.`);
      return null;
    }

    const data = await res.json();
    return data.body ?? null;
  } catch (_err) {
    console.warn('Failed to fetch release notes. Skipping changelog fetch');
    return null;
  }
}

export default function (): string | undefined {
  const changelogPath = path.join(__dirname, 'CHANGELOG_UPSTREAM.txt');

  if (fs.existsSync(changelogPath)) {
    return changelogPath;
  }

  try {
    fetchLatestReleaseNotes().then((body) => {
      if (body) {
        fs.writeFileSync(changelogPath, body);
      } else {
        fs.writeFileSync(changelogPath, 'No changelog available.\n');
      }
    });

    if (fs.existsSync(changelogPath)) {
      return changelogPath;
    }
  } catch (_err) {
    console.warn('Failed to write changelog to disk. Skipping changelog write');
  }

  return undefined;
}
