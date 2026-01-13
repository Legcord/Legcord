import type { GameList, ProcessInfo } from "arrpc";
import { For, createSignal } from "solid-js";
import { sleep } from "../../../common/sleep.js";
import { AddDetectableModal } from "../components/AddDetectableModal.jsx";
import { Dropdown } from "../components/Dropdown.jsx";
import classes from "./RegisteredGames.module.css";
const {
    ui: { Header, HeaderTags, Divider, Button, ButtonSizes, openModal },
} = shelter;

export function RegisteredGamesPage() {
    const [processList, setProcessList] = createSignal<ProcessInfo[]>();
    const [detectables, setDetectables] = createSignal<GameList>();
    const [selectedDetectable, setSelectedDetectable] = createSignal("refresh");
    function getDetectables() {
        window.legcord.rpc.refreshProcessList();
        setDetectables(window.legcord.rpc.getDetectables());
        sleep(500).then(() => {
            setProcessList(window.legcord.rpc.getProcessList());
        });
    }
    getDetectables();
    function addNewGame() {
        openModal(({ close }: { close: () => void }) => (
            <AddDetectableModal close={close} executable={selectedDetectable()} />
        ));
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
                        ...(processList()?.map((p) => ({ label: p[1], value: p[1] })) ?? []),
                        { label: "Refresh list", value: "refresh" },
                    ]}
                />
                <Button size={ButtonSizes.MEDIUM} onClick={addNewGame}>
                    Add
                </Button>
            </div>
            <For each={detectables()}>{(detectable) => <div>{detectable.name}</div>}</For>
        </>
    );
}
