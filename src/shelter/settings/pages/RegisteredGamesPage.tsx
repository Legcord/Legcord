import type { ProcessInfo } from "arrpc";
import { createSignal } from "solid-js";
import { sleep } from "../../../common/sleep.js";
import { Dropdown } from "../components/Dropdown.jsx";
import classes from "./RegisteredGames.module.css";
const {
    ui: { Header, HeaderTags, Divider, Button, ButtonSizes },
} = shelter;

export function RegisteredGamesPage() {
    const [detectables, setDetectables] = createSignal<ProcessInfo[]>();
    const [selectedDetectable, setSelectedDetectable] = createSignal("refresh");
    function getDetectables() {
        window.legcord.rpc.refreshProcessList();
        sleep(500).then(() => {
            setDetectables(window.legcord.rpc.getProcessList());
        });
    }
    getDetectables();
    function addGame() {
        // Logic to add a game
        console.log("Game added");
    }
    return (
        <>
            <Header tag={HeaderTags.H1}>Registered Games</Header>
            <Divider mt mb />
            <div class={classes.addBox}>
                <Dropdown
                    value={selectedDetectable()}
                    onChange={(v) => {
                        if (v === "refresh") {
                            getDetectables();
                            setSelectedDetectable("");
                            console.log("Detectables refreshed");
                        } else {
                            console.log("Selected detectable:", v);
                            setSelectedDetectable(v);
                        }
                    }}
                    options={[
                        ...(detectables()?.map((p) => ({ label: p[1], value: p[1] })) ?? []),
                        { label: "Refresh list", value: "refresh" },
                    ]}
                />
                <Button size={ButtonSizes.MEDIUM} onClick={addGame}>
                    Add
                </Button>
            </div>
        </>
    );
}
