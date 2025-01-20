import type { Accessor } from "solid-js";
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
    return (
        <div onClick={() => onSelect(source.id, source.name)} onKeyUp={() => {}} class={classes.card}>
            <img
                src={source.thumbnail.toDataURL()}
                alt={source.name}
                style={{
                    width: "160px",
                    height: "90px",
                    transition: "0.4s",
                    opacity: selected_name() === source.name ? 1 : 0.4,
                }}
            />
            <p class={classes.name}>{source.name}</p>
        </div>
    );
};
