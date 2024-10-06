import type { ValidMods } from "./settings.js";

export interface RepoData {
    owner: string;
    repo: string;
    branch: string;
}

export type ModData = Record<
    ValidMods,
    {
        repoData: RepoData;
        js: string;
        css?: string;
    }
>;
