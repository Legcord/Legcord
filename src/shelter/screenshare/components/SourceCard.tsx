import type { Accessor } from "solid-js";
import { Show } from "solid-js";
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
    return (
        <div
            onClick={() => onSelect(source.id, source.name)}
            onKeyUp={() => {}}
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
                <img
                    src={source.thumbnail.toDataURL()}
                    alt={source.name}
                    class={isSelected() ? classes.thumbnailSelected : classes.thumbnailUnselected}
                />
            </div>
            <p class={classes.name}>{source.name}</p>
        </div>
    );
};
