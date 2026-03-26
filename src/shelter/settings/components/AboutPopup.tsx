import { For, createSignal, onMount } from "solid-js";
import classes from "./SupportBanner.module.css";
import { CodeIcon, DonateIcon, DiscordIcon } from "./icons/QuickActionIcons.jsx";

const {
    plugin: { store },
    ui: {
        ModalRoot,
        ModalBody,
        ModalHeader,
        ModalSizes,
    },
} = shelter;

interface Contributor {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    contributions: number;
    type: string;
}

export const AboutPopup = (props: { close: () => void }) => {
    const [contributors, setContributors] = createSignal<Contributor[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);

    onMount(async () => {
        try {
            let allContributors: Contributor[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await fetch(
                    `https://api.github.com/repos/Legcord/Legcord/contributors?per_page=100&page=${page}`,
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch contributors");
                }
                const data = await response.json();

                if (data.length === 0) {
                    hasMore = false;
                } else {
                    allContributors = [...allContributors, ...data];
                    page++;

                    if (data.length < 100) {
                        hasMore = false;
                    }
                }
            }

            setContributors(allContributors);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    });

    return (
        <ModalRoot size={ModalSizes.MEDIUM}>
            <ModalHeader close={props.close}>
                {store.i18n["settings-about"] || "About Legcord"}
            </ModalHeader>
            <ModalBody>
                {/* Project Description */}
                <div class={classes.aboutContainer}>
                    <div class={classes.aboutHeader}>
                        <h2 class={classes.aboutTitle}>
                            Legcord
                        </h2>
                        <p class={classes.aboutDescription}>
                            Legcord is a free and open-source Discord client that offers a personalized experience 
                            with advanced features, better performance, and a modern design. 
                            Developed by the community, for the community.
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div class={classes.quickActions}>
                        <h3 class={classes.quickActionsTitle}>
                            Quick Actions
                        </h3>
                        <div class={classes.quickActionsList}>
                            <button
                                type="button"
                                class={classes.quickActionButton}
                                onClick={() => window.open("https://github.com/Legcord/Legcord", "_blank")}
                            >
                                <span class={classes.quickActionButtonIcon}><CodeIcon /></span>
                                View Source Code
                            </button>
                            <button
                                type="button"
                                class={classes.quickActionButton}
                                onClick={() => window.open("https://github.com/sponsors/smartfrigde", "_blank")}
                            >
                                <span class={classes.quickActionButtonIcon}><DonateIcon /></span>
                                Donate
                            </button>
                            <button
                                type="button"
                                class={classes.quickActionButton}
                                onClick={() => window.open("https://discord.gg/JatCnhKufc", "_blank")}
                            >
                                <span class={classes.quickActionButtonIcon}><DiscordIcon /></span>
                                Join Discord
                            </button>
                        </div>
                    </div>

                    {/* Contributors Section */}
                    <div class={classes.contributorsSection}>
                        <h3 class={classes.contributorsTitle}>
                            {store.i18n["settings-contributors"] || "Contributors"}
                        </h3>

                        {loading() && (
                            <div class={classes.loadingState}>
                                {store.i18n["settings-contributors-loading"] || "Loading contributors..."}
                            </div>
                        )}

                        {error() && (
                            <div class={classes.errorState}>
                                {store.i18n["settings-contributors-error"] || "Failed to load contributors"}: {error()}
                            </div>
                        )}

                        {!loading() && !error() && (
                            <div class={classes.contributorsGrid}>
                                <For each={contributors()}>
                                    {(contributor) => (
                                        <div class={classes.contributorCard}>
                                            <a
                                                href={contributor.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class={classes.contributorLink}
                                            >
                                                <img
                                                    src={contributor.avatar_url}
                                                    alt={contributor.login}
                                                    class={classes.contributorAvatar}
                                                />
                                                <div class={classes.contributorName}>
                                                    {contributor.login}
                                                </div>
                                                <div class={classes.contributorInfo}>
                                                    {contributor.type === "User"
                                                        ? `${store.i18n["settings-contributions"] || "Contributions"}: ${contributor.contributions}`
                                                        : store.i18n["settings-contributor-bot"] || "Bot"}
                                                </div>
                                            </a>
                                        </div>
                                    )}
                                </For>
                            </div>
                        )}
                    </div>
                </div>
            </ModalBody>
        </ModalRoot>
    );
};
