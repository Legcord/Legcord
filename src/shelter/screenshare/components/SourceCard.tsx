import type { Accessor } from "solid-js";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import classes from "./SourceCard.module.css";

export interface IPCSources {
    id: string;
    name: string;
    thumbnail: HTMLCanvasElement;
}
interface SourceCardProps {
    source: IPCSources;
    onSelect: (id: string, name: string) => void;
    selected_name: Accessor<string>;
}

export const SourceCard = ({ selected_name, source, onSelect }: SourceCardProps) => {
    const isSelected = () => selected_name() === source.name;
    let videoRef: HTMLVideoElement | undefined;
    const [hasError, setHasError] = createSignal(false);
    let stream: MediaStream | null = null;

    onMount(async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: source.id,
                        minWidth: 150,
                        maxWidth: 400,
                        minHeight: 150,
                        maxHeight: 400,
                        maxFrameRate: 5,
                    },
                } as unknown as MediaTrackConstraints,
            });
            if (videoRef) {
                videoRef.srcObject = stream;
            }
        } catch (err) {
            console.error("Failed to get live preview for", source.name, err);
            setHasError(true);
        }
    });

    onCleanup(() => {
        if (stream) {
            stream.getTracks().forEach((track) => {
                track.stop();
            });
            stream = null;
        }
    });

    return (
        // biome-ignore lint/a11y/useSemanticElements: custom styling makes using button difficult
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(source.id, source.name)}
            onKeyUp={(e) => {
                if (e.key === "Enter") onSelect(source.id, source.name);
            }}
            class={`${classes.card}${isSelected() ? ` ${classes.cardSelected}` : ""}`}
        >
            <Show when={isSelected()}>
                <div class={classes.checkBadge}>
                    <svg class={classes.checkIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <title>Selected</title>
                        <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </div>
            </Show>
            <div class={classes.thumbnailWrapper}>
                <Show
                    when={!hasError()}
                    fallback={
                        <img
                            src={source.thumbnail.toDataURL()}
                            alt={source.name}
                            class={isSelected() ? classes.thumbnailSelected : classes.thumbnailUnselected}
                        />
                    }
                >
                    <video
                        ref={videoRef}
                        autoplay
                        muted
                        class={isSelected() ? classes.thumbnailSelected : classes.thumbnailUnselected}
                        style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;"
                    />
                </Show>
            </div>
            <p class={classes.name}>{source.name}</p>
        </div>
    );
};
