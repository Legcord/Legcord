import {app} from "electron";
import path from "path";
import fs from "fs";
import {i18nStrings} from "../@types/i18nStrings.js";
export function setLang(language: string): void {
    const langConfigFile = `${path.join(app.getPath("userData"), "/storage/")}lang.json`;
    if (!fs.existsSync(langConfigFile)) {
        fs.writeFileSync(langConfigFile, "{}", "utf-8");
    }
    const rawData = fs.readFileSync(langConfigFile, "utf-8");
    const parsed = JSON.parse(rawData) as i18nStrings;
    parsed.lang = language;
    const toSave = JSON.stringify(parsed, null, 4);
    fs.writeFileSync(langConfigFile, toSave, "utf-8");
}
let language: string;
export function getLang(object: string): string {
    if (language == undefined) {
        try {
            const userDataPath = app.getPath("userData");
            const storagePath = path.join(userDataPath, "/storage/");
            const langConfigFile = `${storagePath}lang.json`;
            const rawData = fs.readFileSync(langConfigFile, "utf-8");
            const parsed = JSON.parse(rawData) as i18nStrings;
            language = parsed.lang;
        } catch (_e) {
            console.log("Language config file doesn't exist. Fallback to English.");
            language = "en-US";
        }
    }
    if (language.length == 2) {
        language = `${language}-${language.toUpperCase()}`;
    }
    let langPath = path.join(import.meta.dirname, "../", `/assets/lang/${language}.json`);
    if (!fs.existsSync(langPath)) {
        langPath = path.join(import.meta.dirname, "../", "/assets/lang/en-US.json");
    }
    let rawData = fs.readFileSync(langPath, "utf-8");
    let parsed = JSON.parse(rawData) as i18nStrings;
    if (parsed[object] == undefined) {
        console.log(`${object} is undefined in ${language}`);
        langPath = path.join(import.meta.dirname, "../", "/assets/lang/en-US.json");
        rawData = fs.readFileSync(langPath, "utf-8");
        parsed = JSON.parse(rawData) as i18nStrings;
        return parsed[object];
    } else {
        return parsed[object];
    }
}
export function getRawLang(): i18nStrings {
    if (language == undefined) {
        try {
            const userDataPath = app.getPath("userData");
            const storagePath = path.join(userDataPath, "/storage/");
            const langConfigFile = `${storagePath}lang.json`;
            const rawData = fs.readFileSync(langConfigFile, "utf-8");
            const parsed = JSON.parse(rawData) as i18nStrings;
            language = parsed.lang;
        } catch (_e) {
            console.log("Language config file doesn't exist. Fallback to English.");
            language = "en-US";
        }
    }
    if (language.length == 2) {
        language = `${language}-${language.toUpperCase()}`;
    }
    let langPath = path.join(import.meta.dirname, "../", `/assets/lang/${language}.json`);
    if (!fs.existsSync(langPath)) {
        langPath = path.join(import.meta.dirname, "../", "/assets/lang/en-US.json");
    }
    const rawData = fs.readFileSync(langPath, "utf-8");
    const parsed = JSON.parse(rawData) as i18nStrings;
    return parsed;
}
export function getLangName(): string {
    if (language == undefined) {
        try {
            const userDataPath = app.getPath("userData");
            const storagePath = path.join(userDataPath, "/storage/");
            const langConfigFile = `${storagePath}lang.json`;
            const rawData = fs.readFileSync(langConfigFile, "utf-8");
            const parsed = JSON.parse(rawData) as i18nStrings;
            language = parsed.lang;
        } catch (_e) {
            console.log("Language config file doesn't exist. Fallback to English.");
            language = "en-US";
        }
    }
    if (language.length == 2) {
        language = `${language}-${language.toUpperCase()}`;
    }
    return language;
}
