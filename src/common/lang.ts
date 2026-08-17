import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { i18nStrings } from "../@types/i18nStrings.js";

let languageCache: i18nStrings | null = null;
let currentLanguage: string | null = null;

function resolveLangFromConfig(): string {
    if (currentLanguage) return currentLanguage;
    try {
        const langConfigFile = `${path.join(app.getPath("userData"), "/storage/")}lang.json`;
        const rawData = fs.readFileSync(langConfigFile, "utf-8");
        const parsed = JSON.parse(rawData) as i18nStrings;
        currentLanguage = parsed.lang;
    } catch {
        currentLanguage = "en-US";
    }
    if (currentLanguage.length === 2) {
        currentLanguage = `${currentLanguage}-${currentLanguage.toUpperCase()}`;
    }
    return currentLanguage;
}

function getLangFilePath(lang: string): string {
    const langPath = path.join(import.meta.dirname, "../", `/assets/lang/${lang}.json`);
    if (fs.existsSync(langPath)) return langPath;
    return path.join(import.meta.dirname, "../", "/assets/lang/en-US.json");
}

function loadLanguage(): i18nStrings {
    if (languageCache) return languageCache;

    const lang = resolveLangFromConfig();
    const langPath = getLangFilePath(lang);
    const fallbackPath = path.join(import.meta.dirname, "../", "/assets/lang/en-US.json");

    const rawData = fs.readFileSync(langPath, "utf-8");
    const parsed = JSON.parse(rawData) as i18nStrings;

    if (langPath !== fallbackPath) {
        const fallbackData = fs.readFileSync(fallbackPath, "utf-8");
        const fallbackParsed = JSON.parse(fallbackData) as i18nStrings;
        for (const key in fallbackParsed) {
            if (parsed[key] === undefined) {
                parsed[key] = fallbackParsed[key];
            }
        }
    }

    languageCache = parsed;
    return parsed;
}

export function setLang(language: string): void {
    const langConfigFile = `${path.join(app.getPath("userData"), "/storage/")}lang.json`;
    const dir = path.dirname(langConfigFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const toSave = JSON.stringify({ lang: language }, null, 4);
    fs.writeFileSync(langConfigFile, toSave, "utf-8");
    console.log(`Setting language to ${language}`);
    currentLanguage = null;
    languageCache = null;
}

export function getLang(object: string): string {
    const data = loadLanguage();
    return data[object] ?? "";
}

export function getRawLang(): i18nStrings {
    return loadLanguage();
}

export function getLangName(): string {
    return resolveLangFromConfig();
}
