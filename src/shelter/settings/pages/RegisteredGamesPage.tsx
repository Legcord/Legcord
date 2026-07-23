import type { GameList, ProcessInfo } from "arrpc";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { DetectedGame } from "../../../@types/legcordWindow.d.ts";
import { sleep } from "../../../common/sleep.js";
import { AddDetectableModal } from "../components/AddDetectableModal.jsx";
import { DetectableCard } from "../components/DetectableCard.jsx";
import { Dropdown } from "../components/Dropdown.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { SettingsPageHeader } from "../components/SettingsPageHeader.jsx";
import classes from "./RegisteredGames.module.css";

const {
    ui: { Header, HeaderTags, Divider, Button, ButtonSizes, openModal },
} = shelter;

function formatProcessName(processName: string) {
    if (window.legcord.platform === "darwin") {
        return processName.split("/").filter(Boolean).at(-1) ?? processName;
    }

    return processName;
}

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
            <SettingsPageHeader title={t["games-registeredGames"]} description={t["games-pageDesc"]} />
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
                            setSelectedDetectable(formatProcessName(v));
                        }
                    }}
                    options={[
                        ...(processList()?.map((p) => {
                            const processName = formatProcessName(p[1]);

                            return { label: processName, value: processName };
                        }) ?? []),
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
                fallback={<EmptyState message={t["games-empty"]} description={t["games-emptyDesc"]} />}
            >
                <For each={detectables()}>
                    {(detectable) => <DetectableCard detectable={detectable} onRemove={refreshDetectables} />}
                </For>
            </Show>

            <Header tag={HeaderTags.HeadingLG} class={classes.sectionHeader}>
                {t["games-lastDetected"]}
            </Header>
            <Divider mt mb />
            <Show
                when={lastDetected().length > 0}
                fallback={
                    <EmptyState message={t["games-lastDetectedEmpty"]} description={t["games-lastDetectedEmptyDesc"]} />
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

            <Header tag={HeaderTags.HeadingLG} class={classes.sectionHeader}>
                {t["games-blacklisted"]}
            </Header>
            <Divider mt mb />
            <Show
                when={blacklisted().length > 0}
                fallback={
                    <EmptyState message={t["games-blacklistedEmpty"]} description={t["games-blacklistedEmptyDesc"]} />
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
