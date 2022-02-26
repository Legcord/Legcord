declare module "glasstron" {
  export class BrowserWindow extends Electron.BrowserWindow {
    getBlur(): Promise<boolean>;
    setBlur(value: boolean): Promise<boolean>;
    blurType: WindowsBlurType;
    setVibrancy(vibrancy: MacOSVibrancy): void;
  }
  /**
   * @deprecated
   */
  export function init(): void;
  /**
   * @deprecated
   */
  export function update(
    window: Electron.BrowserWindow,
    values: {
      windows?: {
        blurType: WindowsBlurType;
      };
      macos?: {
        vibrancy: MacOSVibrancy;
      };
      linux?: {
        requestBlur: boolean;
      };
    }
  ): void;
  export class Hacks {
    static injectOnElectron(): void;
    static delayReadyEvent(): void;
  }
  export type WindowsBlurType =
    | "acrylic"
    | "blurbehind"
    | "transparent"
    | "none";
  export type MacOSVibrancy =
    | (
        | "appearance-based"
        | "light"
        | "dark"
        | "titlebar"
        | "selection"
        | "menu"
        | "popover"
        | "sidebar"
        | "medium-light"
        | "ultra-dark"
        | "header"
        | "sheet"
        | "window"
        | "hud"
        | "fullscreen-ui"
        | "tooltip"
        | "content"
        | "under-window"
        | "under-page"
      )
    | null;
}

declare module "glasstron/src/utils" {
  class Utils {
    static getSavePath(): string;
    static copyToPath(
      innerFile: string,
      outerFilename?: string,
      flags?: number
    ): void;
    static removeFromPath(filename: string): void;
    static isInPath(filename: string): boolean;
    static getPlatform(): any;
    static parseKeyValString(
      string: string,
      keyvalSeparator?: string,
      pairSeparator?: string
    ): any;
    static makeKeyValString(
      object: any,
      keyvalSeparator?: string,
      pairSeparator?: string
    ): string;
  }
  export = Utils;
}
