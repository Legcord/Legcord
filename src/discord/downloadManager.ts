import { getConfig } from "../common/config.js";
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { app } from "electron";
import isDev from "electron-is-dev";

// ============================================================================
// Error Types
// ============================================================================

export class DownloadManagerError extends Error {
    constructor(
        public managerType: string,
        message: string,
        public cause?: Error
    ) {
        super(`[${managerType}] ${message}`);
        this.name = "DownloadManagerError";
    }
}

export class ConfigurationError extends DownloadManagerError {
    constructor(managerType: string, message: string, cause?: Error) {
        super(managerType, message, cause);
        this.name = "ConfigurationError";
    }
}

export class NetworkError extends DownloadManagerError {
    constructor(managerType: string, message: string, cause?: Error) {
        super(managerType, message, cause);
        this.name = "NetworkError";
    }
}

// ============================================================================
// Generic Download Manager Types and Interfaces
// ============================================================================

export interface DownloadManagerTaskOptions {
    filename?: string;
    headers?: Record<string, string>;
    method?: "GET" | "POST";
}

export interface DownloadManagerConfig {
    host?: unknown;
    token?: unknown;
}

export interface DownloadManagerMetadata {
    name: string;
    displayName: string;
    description: string;
    platforms: ("win32" | "darwin" | "linux")[];
    requiresConfig: boolean;
    supportsDeepLink: boolean;
}

export interface DeepLinkCapable {
    canUseDeepLink(): boolean;
    createDeepLink(url: string, headers: Record<string, string>, filename?: string): string;
}

export abstract class DownloadManager {
    protected config: DownloadManagerConfig;

    constructor(configKey: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.config = (getConfig(configKey as any) as DownloadManagerConfig) ?? {};
    }

    abstract createTask(url: string, options?: DownloadManagerTaskOptions): Promise<string>;
    abstract isConfigured(): boolean;
    abstract getMetadata(): DownloadManagerMetadata;
    
    /**
     * Validate configuration before attempting downloads.
     * Returns validation result with errors if any.
     */
    validateConfig(): { valid: boolean; errors: string[] } {
        return { valid: this.isConfigured(), errors: [] };
    }
    
    /**
     * Check if this manager can handle the given URL.
     * Default implementation accepts all HTTP(S) URLs.
     */
    async canCreateTask(url: string): Promise<boolean> {
        try {
            const parsed = new URL(url);
            return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
            return false;
        }
    }
    
    /**
     * Bring this download manager's window to the foreground.
     * Default implementation does nothing. Override in subclasses if needed.
     */
    async bringToFront(): Promise<void> {
        // Default: no-op
    }
}

// ============================================================================
// Gopeed Download Manager Implementation
// ============================================================================

interface GopeedApiResult<T> {
    code: number;
    msg?: string;
    message?: string;
    data: T;
}

export class GopeedDownloadManager extends DownloadManager implements DeepLinkCapable {
    constructor() {
        super("gopeed");
    }

    getMetadata(): DownloadManagerMetadata {
        return {
            name: "gopeed",
            displayName: "Gopeed",
            description: "High-speed download manager with REST API",
            platforms: ["win32", "darwin", "linux"],
            requiresConfig: true,
            supportsDeepLink: true,
        };
    }

    validateConfig(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const host = this.normalizeHost(this.config.host);
        
        try {
            new URL(host);
        } catch {
            errors.push("Invalid host URL format");
        }
        
        return { valid: errors.length === 0, errors };
    }

    public normalizeHost(host: unknown): string {
        const trimmed = typeof host === "string" ? host.trim() : "";
        if (!trimmed) {
            return "http://127.0.0.1:9999";
        }

        const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
        const withoutTrailingSlash = withProtocol.replace(/\/+$/, "");
        return withoutTrailingSlash.replace(/\/api\/v1(?:\/tasks)?$/i, "");
    }

    private parseApiResult(bodyText: string): GopeedApiResult<string> {
        try {
            return JSON.parse(bodyText) as GopeedApiResult<string>;
        } catch {
            throw new NetworkError("gopeed", `API returned non-JSON response: ${bodyText.slice(0, 300)}`);
        }
    }

    canUseDeepLink(): boolean {
        try {
            const host = this.normalizeHost(this.config.host);
            const parsed = new URL(host);
            const hostname = parsed.hostname.toLowerCase();
            return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1" || hostname === "[::1]";
        } catch {
            return false;
        }
    }

    createDeepLink(url: string, headers: Record<string, string>, filename?: string): string {
        const payload = this.buildPayload(url, headers, filename);

        const encodedParams = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
        return `gopeed:///create?params=${encodeURIComponent(encodedParams)}`;
    }

    private buildPayload(
        url: string,
        headers?: Record<string, string>,
        filename?: string,
        method?: "GET" | "POST"
    ): {
        req: { url: string; extra?: { header?: Record<string, string>; method?: "GET" | "POST" } };
        opts?: { name?: string };
    } {
        const extra: { header?: Record<string, string>; method?: "GET" | "POST" } = {};

        if (headers && Object.keys(headers).length > 0) {
            extra.header = headers;
        }
        if (method) {
            extra.method = method;
        }

        const req = Object.keys(extra).length > 0 ? { url, extra } : { url };
        return filename
            ? {
                  req,
                  opts: { name: filename },
              }
            : {
                  req,
              };
    }

    isConfigured(): boolean {
        // Gopeed is configured if we can reach it. Always allow attempting connection.
        return true;
    }

    async bringToFront(): Promise<void> {
        // Use Gopeed's URI protocol handler to bring window to front
        try {
            const { shell } = await import("electron");
            await shell.openExternal("gopeed://");
        } catch {
            // Silently fail if shell unavailable
        }
    }

    async createTask(url: string, options: DownloadManagerTaskOptions = {}): Promise<string> {
        const token = typeof this.config.token === "string" ? this.config.token.trim() : "";
        const host = this.normalizeHost(this.config.host);
        const requestUrl = `${host}/api/v1/tasks`;
        const payload = this.buildPayload(url, options.headers, options.filename, options.method);
        const payloadText = JSON.stringify(payload);

        let response: Response;
        try {
            response = await fetch(requestUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "X-Api-Token": token } : {}),
                },
                body: payloadText,
                signal: AbortSignal.timeout(8_000),
            });
        } catch (error) {
            throw new NetworkError(
                "gopeed",
                `Failed to connect to Gopeed at ${host}`,
                error instanceof Error ? error : undefined
            );
        }

        const bodyText = await response.text();
        if (!response.ok) {
            throw new NetworkError("gopeed", `API returned HTTP ${response.status}: ${bodyText.slice(0, 300)}`);
        }

        const json = this.parseApiResult(bodyText);
        if (json.code !== 0) {
            throw new DownloadManagerError(
                "gopeed",
                json.msg ?? json.message ?? "Unknown Gopeed API error"
            );
        }

        return json.data;
    }
}

// ============================================================================
// Internet Download Manager (IDM) Implementation
// ============================================================================

interface IDMTaskResult {
    success: boolean;
    error?: string;
    message?: string;
}

function getIDMHelperScriptPath(): string {
    // Get the VBScript helper path relative to app root
    // This function is called at runtime, after app initialization
    let scriptPath = join(app.getAppPath(), "scripts", "idm_helper.vbs");
    
    // When packaged in ASAR, external processes (like cscript) cannot access files inside the archive.
    // Electron-builder unpacks these files to app.asar.unpacked, so we must point to that location.
    // Use regex to replace only the app.asar part of the path, ensuring we don't accidentally replace parts of user directories
    if (app.isPackaged && scriptPath.includes("app.asar")) { 
        scriptPath = scriptPath.replace(/app\.asar([\\/])scripts/, "app.asar.unpacked$1scripts");
    }
    
    if (isDev) console.debug(`[IDM] Helper script path: ${scriptPath}`);
    return scriptPath;
}

export class IDMDownloadManager extends DownloadManager {
    constructor() {
        super("idm");
    }

    getMetadata(): DownloadManagerMetadata {
        return {
            name: "idm",
            displayName: "Internet Download Manager",
            description: "Professional download manager for Windows",
            platforms: ["win32"],
            requiresConfig: false,
            supportsDeepLink: false,
        };
    }

    isConfigured(): boolean {
        return true; // IDM is system-wide, always available if installed
    }

    async canCreateTask(url: string): Promise<boolean> {
        // IDM only works on Windows
        if (process.platform !== "win32") {
            return false;
        }
        return super.canCreateTask(url);
    }

    async bringToFront(): Promise<void> {
        let helperScript = join(app.getAppPath(), "scripts", "bring_idm_to_front.vbs");
        
        // Similar check for packaged app - point to unpacked version
        if (app.isPackaged && helperScript.includes("app.asar")) {
            helperScript = helperScript.replace(/app\.asar([\\/])scripts/, "app.asar.unpacked$1scripts");
        }

        if (isDev) console.debug(`[IDM] Bringing to front using script: ${helperScript}`);
        
        // Fire and forget - don't wait for completion
        try {
            const process = spawn("cscript.exe", [helperScript], {
                detached: true,
                stdio: "ignore",
            });
            process.unref();
        } catch (error) {
            if (isDev) console.debug(`[IDM] Failed to bring to front: ${error instanceof Error ? error.message : String(error)}`);
            // Silently fail if script cannot be executed
        }
    }

    private async executeIDMHelper(
        url: string,
        referrer: string,
        cookie: string,
        filename?: string
    ): Promise<IDMTaskResult> {
        return new Promise((resolve, reject) => {
            const helperScript = getIDMHelperScriptPath();
            
            // VBScript expects: cscript.exe idm_helper.vbs url referrer cookie postData username password outputPath outputFilename userAgent flags
            const args = [
                helperScript,
                url,
                referrer,
                cookie,
                "", // post_data (empty)
                "", // username (empty)
                "", // password (empty)
                "", // output_path (empty - let IDM use default)
                filename || "", // output_filename
                "", // user_agent (empty)
                "1", // flags: 1 = silent download
            ];

            // Use cscript.exe to execute the VBScript
            const ps = spawn("cscript.exe", args, { stdio: ["pipe", "pipe", "pipe"] });
            let output = "";
            let errorOutput = "";

            ps.stdout?.on("data", (data: Buffer) => {
                output += data.toString();
            });

            ps.stderr?.on("data", (data: Buffer) => {
                errorOutput += data.toString();
            });

            ps.on("close", (code: number | null) => {
                try {
                    // Parse the JSON response from VBScript
                    const jsonMatch = output.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
                    const jsonStr = jsonMatch ? jsonMatch[0] : output.trim();
                    const result = JSON.parse(jsonStr) as IDMTaskResult;
                    
                    if (result.success) {
                        resolve(result);
                    } else {
                        reject(new DownloadManagerError("idm", result.error || "Unknown IDM error"));
                    }
                } catch (error) {
                    const errorMsg = errorOutput.trim() || output.trim() || `exit code ${code}`;
                    const details = `Script: ${helperScript}\nStdout: ${output.slice(0, 500)}\nStderr: ${errorOutput.slice(0, 500)}`;
                    reject(
                        new DownloadManagerError(
                            "idm",
                            `Failed to execute IDM helper: ${errorMsg}\nDebug info: ${details}`
                        )
                    );
                }
            });

            ps.on("error", (err: Error) => {
                reject(
                    new DownloadManagerError(
                        "idm",
                        `Failed to execute IDM helper script: ${err.message}\nScript path: ${helperScript}`,
                        err
                    )
                );
            });
        });
    }

    async createTask(url: string, options: DownloadManagerTaskOptions = {}): Promise<string> {
        try {
            const referrer = options.headers?.Referer ?? "";
            const cookieHeader = options.headers?.Cookie ?? "";

            const result = await this.executeIDMHelper(url, referrer, cookieHeader, options.filename);
            return result.message || "Download task sent to IDM successfully";
        } catch (error) {
            throw new DownloadManagerError(
                "idm",
                `Failed to send download to IDM: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error : undefined
            );
        }
    }
}

// ============================================================================
// Download Manager Factory
// ============================================================================

export class DownloadManagerFactory {
    private static managers = new Map<string, new () => DownloadManager>([
        ["gopeed", GopeedDownloadManager],
        ["idm", IDMDownloadManager],
    ]);

    /**
     * Create a download manager instance by type.
     * Returns null if the type is not registered or not supported on this platform.
     */
    static create(type: string): DownloadManager | null {
        const ManagerClass = this.managers.get(type);
        if (!ManagerClass) {
            return null;
        }

        const manager = new ManagerClass();
        const metadata = manager.getMetadata();
        
        // Check platform compatibility
        if (!metadata.platforms.includes(process.platform as "win32" | "darwin" | "linux")) {
            return null;
        }

        return manager;
    }

    /**
     * Register a new download manager type.
     * Allows adding custom download managers at runtime.
     */
    static register(type: string, managerClass: new () => DownloadManager): void {
        this.managers.set(type, managerClass);
    }

    /**
     * Get all registered manager types.
     */
    static getRegisteredTypes(): string[] {
        return Array.from(this.managers.keys());
    }

    /**
     * Get all managers compatible with the current platform.
     */
    static getAvailableManagers(): DownloadManager[] {
        const managers: DownloadManager[] = [];
        for (const type of this.managers.keys()) {
            const manager = this.create(type);
            if (manager) {
                managers.push(manager);
            }
        }
        return managers;
    }

    /**
     * Get metadata for all available managers.
     */
    static getAvailableMetadata(): DownloadManagerMetadata[] {
        return this.getAvailableManagers().map(m => m.getMetadata());
    }
}
