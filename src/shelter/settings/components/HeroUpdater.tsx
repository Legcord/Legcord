import { createSignal } from "solid-js";
import classes from "./HeroUpdater.module.css";
const {
    ui: {
        Button,
        ButtonSizes,
        Header,
        HeaderTags,
        Text,
        ButtonColors,
    },
} = shelter;
const LOGO_URL = "https://github.com/Legcord/Branding/raw/main/assets/legcord-banner.png";

async function checkForUpdates() {
    const response = await fetch("https://legcord.app/latest.json");
    const data = await response.json();
    const remoteVersion = data.version.replace(/\./g, ""); // easy to compare
    if (remoteVersion > window.legcord.version.replace(/\./g, "")) {
        return true;
    } else {
        return false;
    }
}

const DOWNLOAD_URL = "https://legcord.app/download";

export const HeroUpdater = () => {
    const [checking, setChecking] = createSignal(false);
    const [updateAvailable, setUpdateAvailable] = createSignal<boolean | null>(null);

    const handleCheck = async () => {
        setChecking(true);
        setUpdateAvailable(null);
        const available = await checkForUpdates();
        setUpdateAvailable(available);
        setChecking(false);
    };

    const handleDownload = () => {
        window.open(DOWNLOAD_URL, "_blank");
    };

    return (
        <div class={classes.hero}>
            <img src={LOGO_URL} alt="Logo" style={{ width: "160px", "margin-bottom": "1rem" }} />
            <Header tag={HeaderTags.H3}>Update Checker</Header>
            <Text>Check if a new version is available and download updates easily.</Text>
            {updateAvailable() === null && (
                <Button onClick={handleCheck} class={classes.checkButton} disabled={checking()}>
                    Check for Updates
                </Button>
            )}
            
            {updateAvailable() === true && (
                <>  
                    <Text>Update available!</Text>
                    <Button size={ButtonSizes.XLARGE} color={ButtonColors.RED} onClick={handleDownload}>
                        Open Download Page
                    </Button>
                </>
            )}
            {updateAvailable() === false && (
                <Text>Your app is up to date.</Text>
            )}
        </div>
    );
};
