import { For, createSignal, onMount } from "solid-js";

const {
    plugin: { store },
    ui: { Header, HeaderTags },
} = shelter;

interface Contributor {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    contributions: number;
    type: string;
}

export function ContributorsPage() {
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

                    // Si on a moins de 100 résultats, c'est la dernière page
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
        <>
            <Header tag={HeaderTags.H5}>{store.i18n["settings-contributors"] || "Contributors"}</Header>

            {loading() && (
                <div style={{ padding: "20px", "text-align": "center" }}>
                    {store.i18n["settings-contributors-loading"] || "Loading contributors..."}
                </div>
            )}

            {error() && (
                <div style={{ padding: "20px", "text-align": "center", color: "var(--text-danger)" }}>
                    {store.i18n["settings-contributors-error"] || "Failed to load contributors"}: {error()}
                </div>
            )}

            {!loading() && !error() && (
                <div
                    style={{
                        display: "grid",
                        "grid-template-columns": "repeat(4, 1fr)",
                        gap: "16px",
                        padding: "20px",
                        "max-width": "100%",
                        width: "100%",
                        "justify-items": "center",
                    }}
                >
                    <For each={contributors()}>
                        {(contributor) => (
                            <div
                                style={{
                                    "background-color": "var(--background-secondary)",
                                    border: "1px solid var(--background-modifier-accent)",
                                    "border-radius": "12px",
                                    padding: "20px",
                                    "text-align": "center",
                                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                    "min-width": "200px",
                                    "max-width": "100%",
                                    "box-sizing": "border-box",
                                    width: "100%",
                                    display: "flex",
                                    "flex-direction": "column",
                                    "align-items": "center",
                                    "justify-content": "center",
                                }}
                            >
                                <a
                                    href={contributor.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        "text-decoration": "none",
                                        color: "inherit",
                                        display: "flex",
                                        "flex-direction": "column",
                                        "align-items": "center",
                                        "justify-content": "center",
                                        width: "100%",
                                    }}
                                >
                                    <img
                                        src={contributor.avatar_url}
                                        alt={contributor.login}
                                        style={{
                                            width: "80px",
                                            height: "80px",
                                            "border-radius": "50%",
                                            "margin-bottom": "16px",
                                            "max-width": "100%",
                                            border: "3px solid var(--background-modifier-accent)",
                                            "object-fit": "cover",
                                        }}
                                    />
                                    <div
                                        style={{
                                            "font-weight": "bold",
                                            "font-size": "16px",
                                            "margin-bottom": "8px",
                                            color: "var(--text-normal)",
                                            "word-break": "break-word",
                                            "overflow-wrap": "break-word",
                                            "text-align": "center",
                                        }}
                                    >
                                        {contributor.login}
                                    </div>
                                    <div
                                        style={{
                                            "font-size": "14px",
                                            color: "var(--text-muted)",
                                            "margin-bottom": "8px",
                                            "text-align": "center",
                                        }}
                                    >
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
        </>
    );
}
