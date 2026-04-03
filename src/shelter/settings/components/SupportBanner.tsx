import { AboutPopup } from "./AboutPopup.jsx";
import classes from "./SupportBanner.module.css";
import { InfoIcon } from "./icons/InfoIcon.jsx";
import { DonateIcon, XIcon } from "./icons/QuickActionIcons.jsx";

const {
    plugin: { store },
    ui: { openModal },
} = shelter;

function openAboutModal() {
    openModal((close: () => void) => <AboutPopup close={close} />);
}

export function SupportBanner() {
    return (
        <div class={classes.supportBanner}>
            <button
                type="button"
                class={classes.dismissButton}
                onClick={() => window.legcord.settings.setConfig("supportBannerDismissed", true)}
            >
                <XIcon />
            </button>

            <h3 class={classes.title}>{store.i18n["supportBanner-title"]}</h3>
            <p class={classes.subtitle}>{store.i18n["supportBanner-subtitle"]}</p>

            <span
                style={{
                    display: "flex",
                    "justify-content": "center",
                    gap: "16px",
                }}
            >
                <button
                    type="button"
                    class={classes.donateButton}
                    onClick={() => window.open("https://github.com/sponsors/smartfrigde", "_blank")}
                >
                    <DonateIcon /> {store.i18n["supportBanner-donate"]}
                </button>

                <button type="button" class={classes.infoButton} onClick={openAboutModal} title="About Legcord">
                    <InfoIcon /> {store.i18n["menu-about"]}
                </button>
            </span>
        </div>
    );
}
