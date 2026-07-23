import type { Display, Rectangle } from "electron";

export const DEFAULT_WINDOW_WIDTH = 835;
export const DEFAULT_WINDOW_HEIGHT = 600;
export const MIN_WINDOW_WIDTH = 400;
export const MIN_WINDOW_HEIGHT = 300;

/** At least this much of the window must sit inside the workArea to count as visible. */
const MIN_VISIBLE_PX = 50;

export type WindowBoundsInput = {
    width?: unknown;
    height?: unknown;
    x?: unknown;
    y?: unknown;
    displayId?: unknown;
};

export type SanitizedWindowBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
    displayId: number;
    displayScaleFactor: number;
    usedFallback: boolean;
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function intersectsWorkArea(rect: Rectangle, workArea: Rectangle, minVisible: number): boolean {
    const left = Math.max(rect.x, workArea.x);
    const top = Math.max(rect.y, workArea.y);
    const right = Math.min(rect.x + rect.width, workArea.x + workArea.width);
    const bottom = Math.min(rect.y + rect.height, workArea.y + workArea.height);
    const visibleW = Math.max(0, right - left);
    const visibleH = Math.max(0, bottom - top);
    return visibleW >= minVisible && visibleH >= minVisible;
}

function fitSizeToWorkArea(width: number, height: number, workArea: Rectangle): { width: number; height: number } {
    const fittedWidth = Math.min(Math.max(width, MIN_WINDOW_WIDTH), Math.max(workArea.width, MIN_WINDOW_WIDTH));
    const fittedHeight = Math.min(Math.max(height, MIN_WINDOW_HEIGHT), Math.max(workArea.height, MIN_WINDOW_HEIGHT));
    // Prefer staying within the workArea when it is at least the minimum size.
    return {
        width: workArea.width >= MIN_WINDOW_WIDTH ? Math.min(fittedWidth, workArea.width) : fittedWidth,
        height: workArea.height >= MIN_WINDOW_HEIGHT ? Math.min(fittedHeight, workArea.height) : fittedHeight,
    };
}

function fitRectToWorkArea(
    width: number,
    height: number,
    x: number | undefined,
    y: number | undefined,
    workArea: Rectangle,
): Rectangle {
    const { width: fittedWidth, height: fittedHeight } = fitSizeToWorkArea(width, height, workArea);

    const maxX = workArea.x + Math.max(0, workArea.width - fittedWidth);
    const maxY = workArea.y + Math.max(0, workArea.height - fittedHeight);

    if (isFiniteNumber(x) && isFiniteNumber(y)) {
        const candidate = { x, y, width: fittedWidth, height: fittedHeight };
        if (intersectsWorkArea(candidate, workArea, MIN_VISIBLE_PX)) {
            return {
                x: clamp(x, workArea.x, maxX),
                y: clamp(y, workArea.y, maxY),
                width: fittedWidth,
                height: fittedHeight,
            };
        }
    }

    // Missing / off-screen coords — center on this display.
    return {
        x: workArea.x + Math.round((workArea.width - fittedWidth) / 2),
        y: workArea.y + Math.round((workArea.height - fittedHeight) / 2),
        width: fittedWidth,
        height: fittedHeight,
    };
}

function findDisplayForPoint(displays: Display[], x: number, y: number): Display | undefined {
    const containing = displays.find(
        (d) =>
            x >= d.bounds.x && y >= d.bounds.y && x < d.bounds.x + d.bounds.width && y < d.bounds.y + d.bounds.height,
    );
    if (containing) return containing;

    let best: Display | undefined;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const d of displays) {
        const cx = clamp(x, d.bounds.x, d.bounds.x + d.bounds.width);
        const cy = clamp(y, d.bounds.y, d.bounds.y + d.bounds.height);
        const dx = x - cx;
        const dy = y - cy;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
            bestDist = dist;
            best = d;
        }
    }
    return best;
}

/**
 * Sanitize saved/live window bounds so the window is always a usable size
 * and visible on a connected display (preferring the remembered displayId).
 */
export function sanitizeWindowBounds(input: WindowBoundsInput, displays: Display[]): SanitizedWindowBounds {
    const list = displays.length > 0 ? displays : [];
    let usedFallback = false;

    let width = isFiniteNumber(input.width) ? input.width : DEFAULT_WINDOW_WIDTH;
    let height = isFiniteNumber(input.height) ? input.height : DEFAULT_WINDOW_HEIGHT;
    if (!isFiniteNumber(input.width) || !isFiniteNumber(input.height)) {
        usedFallback = true;
    }
    width = Math.max(MIN_WINDOW_WIDTH, width);
    height = Math.max(MIN_WINDOW_HEIGHT, height);

    const savedDisplayId = isFiniteNumber(input.displayId) ? input.displayId : undefined;
    const x = isFiniteNumber(input.x) ? input.x : undefined;
    const y = isFiniteNumber(input.y) ? input.y : undefined;

    let target: Display | undefined;
    if (savedDisplayId !== undefined) {
        target = list.find((d) => d.id === savedDisplayId);
        if (!target) usedFallback = true;
    }
    if (!target && x !== undefined && y !== undefined && list.length > 0) {
        target = findDisplayForPoint(list, x, y);
    }
    if (!target) {
        target = list[0];
        usedFallback = true;
    }

    if (!target) {
        return {
            x: 0,
            y: 0,
            width,
            height,
            displayId: 0,
            displayScaleFactor: 1,
            usedFallback: true,
        };
    }

    const fitted = fitRectToWorkArea(width, height, x, y, target.workArea);

    return {
        x: fitted.x,
        y: fitted.y,
        width: fitted.width,
        height: fitted.height,
        displayId: target.id,
        displayScaleFactor: target.scaleFactor,
        usedFallback,
    };
}
