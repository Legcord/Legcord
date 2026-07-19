import { createSignal, onMount } from "solid-js";
import classes from "./InviteModal.module.css";

const {
    ui: { ModalRoot, ModalBody, ModalSizes },
} = shelter;

interface InviteInfo {
    code: string;
    guild?: {
        id: string;
        name: string;
        icon: string | null;
        banner: string | null;
        description: string | null;
        features: string[];
        vanity_url_code: string | null;
        approximate_member_count: number;
        approximate_presence_count: number;
    };
    channel?: {
        id: string;
        name: string;
        type: number;
    };
    inviter?: {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
    };
    expires_at: string | null;
}

function navigateToInvite(code: string) {
    const path = `/invite/${encodeURIComponent(code)}`;
    history.pushState({}, null, path);
    window.dispatchEvent(new PopStateEvent("popstate", {}));
}

export const InviteModal = (props: { close: () => void; code: string }) => {
    const [invite, setInvite] = createSignal<InviteInfo | null>(null);
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);

    const fetchInvite = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `https://discord.com/api/v10/invites/${encodeURIComponent(props.code)}?with_counts=true&with_expiration=true`,
                { credentials: "include" },
            );
            if (!res.ok) {
                if (res.status === 404) {
                    setError("This invite is invalid or has expired.");
                } else {
                    setError(`Failed to load invite (${res.status})`);
                }
                setLoading(false);
                return;
            }
            const data = (await res.json()) as InviteInfo;
            setInvite(data);
            setLoading(false);
        } catch {
            setError("Could not connect to Discord.");
            setLoading(false);
        }
    };

    onMount(fetchInvite);

    const handleJoin = () => {
        navigateToInvite(props.code);
        props.close();
    };

    const guildName = () => invite()?.guild?.name ?? invite()?.channel?.name ?? "Unknown Server";

    const guildIcon = () => {
        const g = invite()?.guild;
        if (!g?.icon || !g?.id) return null;
        const ext = g.icon.startsWith("a_") ? "gif" : "png";
        return `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${ext}?size=160`;
    };

    const guildBanner = () => {
        const g = invite()?.guild;
        if (!g?.banner || !g?.id) return null;
        return `https://cdn.discordapp.com/banners/${g.id}/${g.banner}.png?size=480`;
    };

    const memberCount = () => invite()?.guild?.approximate_member_count;
    const presenceCount = () => invite()?.guild?.approximate_presence_count;

    const avatarUrl = () => {
        const inv = invite()?.inviter;
        if (!inv) return null;
        if (inv.avatar) {
            const ext = inv.avatar.startsWith("a_") ? "gif" : "png";
            return `https://cdn.discordapp.com/avatars/${inv.id}/${inv.avatar}.${ext}?size=40`;
        }
        const defaultIndex = Number(inv.discriminator) % 5;
        return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    };

    return (
        <ModalRoot size={ModalSizes.SMALL}>
            <ModalBody>
                <div class={classes.inviteContainer}>
                    {loading() && (
                        <div class={classes.loadingContainer}>
                            <div class={classes.spinner} />
                            <span>Loading invite...</span>
                            <div class={classes.loadingPulse}>
                                <span />
                                <span />
                                <span />
                            </div>
                        </div>
                    )}
                    {error() && (
                        <div class={classes.errorContainer}>
                            <div class={classes.errorIcon}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <div class={classes.errorText}>{error()}</div>
                            <div class={classes.errorSubtext}>This invite link may be broken or expired.</div>
                            <button type="button" class={classes.retryButton} onClick={fetchInvite}>
                                Try Again
                            </button>
                        </div>
                    )}
                    {invite() && !loading() && !error() && (
                        <>
                            <div class={classes.banner}>
                                {guildBanner() ? (
                                    <img src={guildBanner()!} alt="" class={classes.bannerImage} />
                                ) : (
                                    <div
                                        class={classes.bannerFallbackBg}
                                        style={{ background: `var(--background-secondary-alt)` }}
                                    />
                                )}
                                <div class={classes.bannerGradient} />
                            </div>
                            <div class={classes.iconSection}>
                                {guildIcon() ? (
                                    <img src={guildIcon()!} alt="" class={classes.serverIcon} />
                                ) : (
                                    <div class={classes.serverIconPlaceholder}>
                                        {guildName().charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div class={classes.body}>
                                <div class={classes.serverName}>{guildName()}</div>
                                {invite()?.guild?.description && (
                                    <div class={classes.serverDescription}>{invite()?.guild?.description}</div>
                                )}
                                {invite()?.guild?.features?.includes("BOOSTS_ENABLED") && (
                                    <div class={classes.boostInfo}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M11.5 2L3 12h5.5L9 22l9-10h-5.5L11.5 2z" />
                                        </svg>
                                        Boost Server
                                    </div>
                                )}
                                {(memberCount() !== undefined || presenceCount() !== undefined) && (
                                    <div class={classes.stats}>
                                        {memberCount() !== undefined && (
                                            <div class={classes.stat}>
                                                <svg class={classes.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                                <span class={classes.statValue}>{memberCount()!.toLocaleString()}</span>
                                                Members
                                            </div>
                                        )}
                                        {presenceCount() !== undefined && (
                                            <div class={classes.stat}>
                                                <svg class={classes.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                <span class={classes.statValue}>{presenceCount()!.toLocaleString()}</span>
                                                Online
                                            </div>
                                        )}
                                    </div>
                                )}
                                {invite()?.inviter && (
                                    <div class={classes.invitedBy}>
                                        Invited by{" "}
                                        <span style="font-weight: 500; color: var(--header-primary);">
                                            {invite()!.inviter!.username}
                                        </span>
                                    </div>
                                )}
                                <div class={classes.actions}>
                                    <button type="button" class={classes.joinButton} onClick={handleJoin}>
                                        Join {guildName()}
                                    </button>
                                    <button type="button" class={classes.cancelButton} onClick={props.close}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ModalBody>
        </ModalRoot>
    );
};
