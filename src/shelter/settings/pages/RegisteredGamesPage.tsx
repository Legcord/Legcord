import type { GameList, ProcessInfo } from "arrpc";
import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import type { DetectedGame } from "../../../@types/legcordWindow.d.ts";
import { sleep } from "../../../common/sleep.js";
import { AddDetectableModal } from "../components/AddDetectableModal.jsx";
import { DetectableCard } from "../components/DetectableCard.jsx";
import { Dropdown } from "../components/Dropdown.jsx";
import classes from "./RegisteredGames.module.css";

const {
    ui: { Header, HeaderTags, Divider, Button, ButtonSizes, openModal },
} = shelter;

export function RegisteredGamesPage() {
    const [processList, setProcessList] = createSignal<ProcessInfo[]>();
    const [detectables, setDetectables] = createSignal<GameList>([]);
    const [selectedDetectable, setSelectedDetectable] = createSignal("refresh");
    const [lastDetected, setLastDetected] = createSignal<DetectedGame[]>([]);
    const [blacklistVersion, setBlacklistVersion] = createSignal(0);

    function refreshDetectables() {
        window.legcord.rpc.refreshProcessList();
        setDetectables(window.legcord.rpc.getDetectables());
        sleep(500).then(() => {
            setProcessList(window.legcord.rpc.getProcessList());
        });
    }

    function getBlacklist(): DetectedGame[] {
        return window.legcord.rpc.getBlacklist();
    }

    function blacklistGame(name: string, id: number) {
        window.legcord.rpc.blacklistGame(name, id);
        setBlacklistVersion((v) => v + 1);
        setLastDetected((list) => filterBlacklisted(list));
    }

    function unblacklistGame(id: number) {
        window.legcord.rpc.unblacklistGame(id);
        setBlacklistVersion((v) => v + 1);
    }

    function filterBlacklisted(list: DetectedGame[]) {
        const returnList: DetectedGame[] = [];
        list.forEach((game) => {
            if (!getBlacklist().some((g) => g.id === Number(game.id))) {
                console.log(`game ${game.name} (${game.id}) is not blacklisted, adding to list...`);
                console.log(getBlacklist());
                returnList.push(game);
            }
        });
        return returnList;
    }

    onMount(() => {
        refreshDetectables();
        const rpc = window.legcordRPC;
        if (rpc) {
            setLastDetected(filterBlacklisted(rpc.lastDetectedGames ?? []));
            rpc.onLastDetectedUpdate = (list) => setLastDetected(filterBlacklisted(list ?? []));
            onCleanup(() => {
                if (rpc) rpc.onLastDetectedUpdate = null;
            });
        }
    });

    function addNewGame() {
        openModal(({ close }: { close: () => void }) => (
            <AddDetectableModal
                close={() => {
                    close();
                    refreshDetectables();
                }}
                executable={selectedDetectable()}
            />
        ));
    }

    const t = shelter.plugin.store.i18n;
    const blacklisted = () => {
        blacklistVersion();
        return getBlacklist();
    };

    return (
        <>
            <Header tag={HeaderTags.H1}>{t["games-registeredGames"]}</Header>
            <Divider mt mb />
            <div class={classes.addBox}>
                <Dropdown
                    class={classes.dropdown}
                    limitHeight
                    maxHeight={300}
                    value={selectedDetectable()}
                    onChange={(v) => {
                        if (v === "refresh") {
                            refreshDetectables();
                            setSelectedDetectable("");
                        } else {
                            setSelectedDetectable(v);
                        }
                    }}
                    options={[
                        ...(processList()?.map((p) => ({ label: p[1], value: p[1] })) ?? []),
                        { label: t["games-refreshList"], value: "refresh" },
                    ]}
                />
                <Button
                    size={ButtonSizes.MEDIUM}
                    onClick={addNewGame}
                    disabled={!selectedDetectable() || selectedDetectable() === "refresh"}
                >
                    {t["games-add"]}
                </Button>
            </div>
            <Show
                when={(detectables()?.length ?? 0) > 0}
                fallback={
                    <Header tag={HeaderTags.H5} class={classes.empty}>
                        {t["games-empty"]}
                    </Header>
                }
            >
                <For each={detectables()}>
                    {(detectable) => <DetectableCard detectable={detectable} onRemove={refreshDetectables} />}
                </For>
            </Show>

            <Header tag={HeaderTags.H3} class={classes.sectionHeader}>
                {t["games-lastDetected"]}
            </Header>
            <Divider mt mb />
            <Show
                when={lastDetected().length > 0}
                fallback={
                    <Header tag={HeaderTags.H5} class={classes.empty}>
                        {t["games-lastDetectedEmpty"]}
                    </Header>
                }
            >
                <ul class={classes.gameList}>
                    <For each={lastDetected()}>
                        {(game) => (
                            <li class={classes.gameRow}>
                                <span class={classes.gameName}>
                                    {game.name} ({game.id})
                                </span>
                                <Button
                                    size={ButtonSizes.SMALL}
                                    onClick={() => blacklistGame(game.name, game.id)}
                                    disabled={blacklisted().some((g) => g.id === game.id)}
                                >
                                    {t["games-blacklist"]}
                                </Button>
                            </li>
                        )}
                    </For>
                </ul>
            </Show>

            <Header tag={HeaderTags.H3} class={classes.sectionHeader}>
                {t["games-blacklisted"]}
            </Header>
            <Divider mt mb />
            <Show
                when={blacklisted().length > 0}
                fallback={
                    <Header tag={HeaderTags.H5} class={classes.empty}>
                        {t["games-blacklistedEmpty"]}
                    </Header>
                }
            >
                <ul class={classes.gameList}>
                    <For each={blacklisted()}>
                        {(game) => (
                            <li class={classes.gameRow}>
                                <span class={classes.gameName}>
                                    {game.name} ({game.id})
                                </span>
                                <Button size={ButtonSizes.SMALL} onClick={() => unblacklistGame(game.id)}>
                                    {t["games-removeFromBlacklist"]}
                                </Button>
                            </li>
                        )}
                    </For>
                </ul>
            </Show>
        </>
    );
}
