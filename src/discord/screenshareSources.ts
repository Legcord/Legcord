export type NativeImageLike = {
    toDataURL?: (type?: string) => string;
    isEmpty?: () => boolean;
};

export type CapturerSourceLike = {
    id: string;
    name: string;
    thumbnail?: NativeImageLike | string | null;
    appIcon?: NativeImageLike | string | null;
};

export type PickerSource = {
    id: string;
    name: string;
    thumbnail: string;
    appIcon?: string;
};

function imageToDataUrl(image: NativeImageLike | string | null | undefined): string {
    if (!image) return "";
    if (typeof image === "string") return image;
    try {
        if (image.isEmpty?.()) return "";
        const url = image.toDataURL?.();
        return typeof url === "string" ? url : "";
    } catch {
        return "";
    }
}

function hashString(value: string): number {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function initialsFromName(name: string): string {
    const parts = name
        .replace(/[()[\]{}]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

/** Distinct, source-specific placeholder when thumbnails/icons are missing or duplicated. */
export function fallbackSourceVisual(id: string, name: string): string {
    const hue = hashString(id || name) % 360;
    const initials = initialsFromName(name || id || "Source");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
<rect width="320" height="180" fill="hsl(${hue} 42% 28%)"/>
<text x="160" y="102" text-anchor="middle" font-family="Segoe UI,sans-serif" font-size="48" font-weight="700" fill="#fff">${initials}</text>
</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function serializeCapturerSources(sources: CapturerSourceLike[]): PickerSource[] {
    const prepared = sources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnailRaw: imageToDataUrl(source.thumbnail),
        appIcon: imageToDataUrl(source.appIcon),
    }));

    const thumbnailCounts = new Map<string, number>();
    for (const source of prepared) {
        if (!source.thumbnailRaw) continue;
        thumbnailCounts.set(source.thumbnailRaw, (thumbnailCounts.get(source.thumbnailRaw) ?? 0) + 1);
    }

    const usedVisuals = new Set<string>();
    return prepared.map((source) => {
        const thumbnailIsDuplicate =
            Boolean(source.thumbnailRaw) && (thumbnailCounts.get(source.thumbnailRaw) ?? 0) > 1;
        let visual = source.thumbnailRaw;
        if (!visual || thumbnailIsDuplicate) {
            if (source.appIcon && !usedVisuals.has(source.appIcon)) {
                visual = source.appIcon;
            }
        }
        if (!visual || usedVisuals.has(visual)) {
            visual = fallbackSourceVisual(source.id, source.name);
        }
        usedVisuals.add(visual);

        const result: PickerSource = {
            id: source.id,
            name: source.name,
            thumbnail: visual,
        };
        if (source.appIcon) result.appIcon = source.appIcon;
        return result;
    });
}
