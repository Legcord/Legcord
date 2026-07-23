import { createSignal, For, onMount } from "solid-js";
import classes from "./SupportBanner.module.css";

const {
    ui: { ModalRoot, ModalBody, ModalHeader, ModalSizes },
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

    onMount(() => {
        fetch("https://api.github.com/repos/Legcord/Legcord/contributors")
            .then((response) => {
                if (!response.ok) throw new Error("Failed to fetch contributors");
                return response.json();
            })
            .then((data) => {
                setContributors(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    });

    return (
        <ModalRoot size={ModalSizes.MEDIUM} class={classes.modal}>
            <ModalHeader close={props.close}>About Legcord</ModalHeader>
            <ModalBody>
                <div class={classes.aboutContainer}>
                    <div class={classes.aboutHeader}>
                        <div class={classes.aboutLogo}>
                            <svg
                                width="200"
                                height="90"
                                viewBox="0 0 2249 1020"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <path
                                    fill-rule="evenodd"
                                    fill="#111725"
                                    d="m102.2 705v-478.6h66.8v478.6zm375.5-196.1q-1.2-29-12.2-49-10.5-20.6-29.6-31.6-19.2-11.6-44.1-11.6-27.9 0-48.8 14.2-20.3 14.2-31.9 40-7.9 16.9-10.4 38zm-166 85.2q12.7 27 34.8 41.9 22.6 14.8 51.7 14.8 51.6 0 87-40.6l35.5 39.3q-22.7 27.8-55.2 43.2-32.5 14.9-72.6 14.9-47.6 0-83-22-35.4-21.9-55.1-60.6-19.8-39.3-19.8-90.9 0-51.6 19.8-90.3 19.7-39.4 55.1-61.3 35.4-21.9 81.3-22.6 54.6 0 87.7 25.2 33 24.5 47 69.6 13.9 45.2 9.8 107.1h-233.7q3.1 17.6 9.7 32.3zm565.9-231.6v308.3q0 49.7-19.7 85.8-19.8 36.1-55.8 56.1-36 19.4-84.7 19.4-36 0-67.9-11.6-32-12.3-60.4-33.6l28.4-50.9q22.1 18 45.3 28.3 23.2 9.7 51.7 9.7 29.6 0 51.1-12.2 22-12.9 33.6-35.5 12.2-22.6 12.2-53.6v-41.6q-13.3 23.7-34.2 38.4-27.9 19.4-67.9 19.4-41.8 0-73.2-20.7-31.3-21.3-48.8-58.7-17.4-37.4-17.4-86.4 0-48.4 16.9-84.5 17.4-36.8 48.2-57.4 31.3-21.3 71.9-21.3 40.7-0.6 69.1 19.4 21.6 14.3 35.4 38.3v-55.1zm-155 54.2q-26.1 0-46.4 14.2-20.3 13.5-31.9 38-11.1 24.5-11.6 56.1 0.5 31.6 11.6 56.2 11.6 24.5 31.3 38.7 20.3 13.5 47 13.5 26.2 0 45.9-13.5 20.3-14.2 31.3-38.7 11.6-24.6 11.6-56.2 0-32.2-11.6-56.1-11-24.5-31.3-38-19.7-14.2-45.9-14.2z"
                                />
                                <path
                                    fill-rule="evenodd"
                                    fill="#9538e6"
                                    d="m1218.3 412.8l-36.5 47.7q-16.3-18.7-38.4-29-22-10.3-49.9-10.3-26.7 0-47.6 14.2-20.9 14.2-32.5 40-11.6 25.1-11.6 58.7 0 33.5 11.6 59.3 11.6 25.2 32.5 40 20.9 14.2 47.6 14.2 29 0 52.3-10.3 23.2-11 38.9-31.6l37.1 40.6q-20.9 29-54.6 45.2-33 16.1-76.6 16.1-45.8 0-81.3-22-34.8-21.9-54.5-60.6-19.8-39.3-19.8-90.9 0-51.6 19.8-90.3 19.7-39.4 54.5-61.3 35.5-22.6 81.3-22.6 41.8 0 73.7 14.2 32.6 13.6 54 38.7zm186.9-52.9q47.6 0 83.6 21.9 36.6 22 56.9 61.3 20.3 38.7 20.3 90.3 0 51.6-20.3 91-20.3 39.3-56.9 61.2-36 22-83.6 22-47.6 0-84.2-22-36.6-21.9-56.9-61.2-20.3-39.4-20.3-91 0-51.6 20.3-90.3 20.3-39.3 56.9-61.3 36.6-21.9 84.2-21.9zm0 60q-27.9 0-49.3 14.8-21.5 14.2-33.7 40-11.6 25.8-11.6 59.4 0 34.2 11.6 60 12.2 25.8 33.7 40.6 21.4 14.2 49.3 14.2 27.9 0 48.8-14.2 21.4-14.8 33-40.6 12.2-25.8 12.2-60 0-33.6-12.2-59.4-11.6-25.8-33-40-20.9-14.8-48.8-14.8zm397.6-60v67.1q-33.1-1.9-57.5 12.9-23.8 14.2-37.1 40-10.1 20.3-12.2 45.4v179.7h-66.8v-342.5h66.8v67.7q14.6-32.2 39.4-49.6 28.5-20.7 67.4-20.7zm166.5-0.6q43 0 72.6 21.3 22.7 15.5 37.1 41.5v-195.7h66.8v478.6h-66.8v-58.5q-14.3 25.4-36.5 41.1-29.6 20.6-72 20.6-44.1 0-77.8-21.9-33.1-22.6-51.7-61.9-18.5-40-18.5-91.6 0-51.6 18.5-90.3 18.6-39.4 51.7-61.3 33.1-21.9 76.6-21.9zm15.1 60q-27.8 0-49.3 14.8-21.5 14.8-33.7 41.3-11.6 25.8-12.2 59.3 0.6 33.6 12.2 59.4 12.2 25.8 33.7 40.6 21.5 14.8 49.3 14.8 27.9 0 49.4-14.8 21.4-14.8 33.1-40.6 12.1-25.8 12.1-59.4 0-34.2-12.1-60-11.7-25.8-33.1-40.6-21.5-14.8-49.4-14.8z"
                                />
                                <path
                                    fill="#cdc6fd"
                                    stroke="#111725"
                                    stroke-miterlimit="10"
                                    stroke-width="20"
                                    d="m528.7 775.2l-52.3 27.2c-28.7 14.9-44.2 26.8-34.2 44.9 9 18.7 27.5 12.9 56.2-2l52.4-27.3"
                                />
                                <path
                                    fill="#cdc6fd"
                                    stroke="#111725"
                                    stroke-miterlimit="10"
                                    stroke-width="20"
                                    d="m598.2 910l-52.4 27.2c-28.6 14.9-44.1 26.8-34.1 44.9 9 18.6 27.5 12.8 56.2-2.1l52.4-27.2"
                                />
                                <path
                                    fill="#9538e6"
                                    stroke="#111725"
                                    stroke-miterlimit="10"
                                    stroke-width="20"
                                    d="m495.6 757.8c1.7-1 27.6-14.6 30.6-16.2 34.9-18.6 94.6-32.2 140.1-4.9 25.2 15.2 38.5 36.2 48.6 54.4 9.3 19.4 18.4 41.8 16.2 71.3-4 53.1-49.6 94.2-84.9 112.1-2.9 1.5-29 14.9-30.8 15.7z"
                                />
                            </svg>
                        </div>
                        <span class={classes.aboutVersion}>
                            {window.legcord?.version === "0.0.0"
                                ? "Dev Build"
                                : `v${window.legcord?.version ?? "1.3.0"}`}
                        </span>
                        <p class={classes.aboutDescription}>
                            A free and open-source Discord client crafted by the community, for the community —
                            delivering advanced features, better performance, and a modern design.
                        </p>
                    </div>

                    <div class={classes.quickActions}>
                        <h3 class={classes.sectionTitle}>Quick Actions</h3>
                        <div class={classes.quickActionsList}>
                            <button
                                type="button"
                                class={classes.quickActionButton}
                                onClick={() => window.open("https://github.com/Legcord/Legcord", "_blank")}
                            >
                                <span class={classes.quickActionButtonIcon}>
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        aria-hidden="true"
                                    >
                                        <polyline points="16 18 22 12 16 6" />
                                        <polyline points="8 6 2 12 8 18" />
                                    </svg>
                                </span>
                                <span class={classes.quickActionButtonLabel}>
                                    <span class={classes.quickActionButtonTitle}>View Source Code</span>
                                    <span class={classes.quickActionButtonDesc}>github.com/Legcord/Legcord</span>
                                </span>
                                <svg
                                    class={classes.quickActionButtonArrow}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                class={classes.quickActionButton}
                                onClick={() => window.open("https://github.com/sponsors/smartfrigde", "_blank")}
                            >
                                <span class={classes.quickActionButtonIcon}>
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        aria-hidden="true"
                                    >
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </span>
                                <span class={classes.quickActionButtonLabel}>
                                    <span class={classes.quickActionButtonTitle}>Donate</span>
                                    <span class={classes.quickActionButtonDesc}>Support the project</span>
                                </span>
                                <svg
                                    class={classes.quickActionButtonArrow}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                class={classes.quickActionButton}
                                onClick={() => window.open("https://discord.gg/JatCnhKufc", "_blank")}
                            >
                                <span class={classes.quickActionButtonIcon}>
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        stroke="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                    </svg>
                                </span>
                                <span class={classes.quickActionButtonLabel}>
                                    <span class={classes.quickActionButtonTitle}>Join Discord Server</span>
                                    <span class={classes.quickActionButtonDesc}>Connect with the community</span>
                                </span>
                                <svg
                                    class={classes.quickActionButtonArrow}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class={classes.contributorsSection}>
                        <h3 class={classes.sectionTitle}>Contributors</h3>
                        {!loading() && !error() && (
                            <span class={classes.contributorBadge}>{contributors().length} contributors</span>
                        )}
                        {loading() && <div class={classes.loadingState}>Loading contributors...</div>}
                        {error() && <div class={classes.errorState}>Failed to load contributors: {error()}</div>}
                        {!loading() && !error() && (
                            <div class={classes.contributorsGrid}>
                                <For each={contributors()}>
                                    {(contributor) => (
                                        <a
                                            href={contributor.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class={classes.contributorLink}
                                        >
                                            <div class={classes.contributorCard}>
                                                <img
                                                    src={contributor.avatar_url}
                                                    alt={`${contributor.login}'s avatar`}
                                                    class={classes.contributorAvatar}
                                                />
                                                <div class={classes.contributorName}>{contributor.login}</div>
                                                <div class={classes.contributorInfo}>
                                                    {contributor.contributions} contributions
                                                </div>
                                            </div>
                                        </a>
                                    )}
                                </For>
                            </div>
                        )}
                    </div>

                    <div class={classes.techSection}>
                        <h3 class={classes.sectionTitle}>Technologies</h3>
                        <div class={classes.techList}>
                            <span class={classes.techTag}>Electron</span>
                            <span class={classes.techTag}>SolidJS</span>
                            <span class={classes.techTag}>TypeScript</span>
                            <span class={classes.techTag}>Rolldown</span>
                            <span class={classes.techTag}>shelter</span>
                            <span class={classes.techTag}>Biome</span>
                        </div>
                    </div>

                    <div class={classes.aboutFooter}>
                        <span>Copyright &copy; Legcord 2024-2026 &middot; OSL-3.0</span>
                    </div>
                </div>
            </ModalBody>
        </ModalRoot>
    );
};
