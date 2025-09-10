import { createSignal, Match, Switch } from "solid-js";
import { updater } from "../../../updater.js";
import classes from "./HeroUpdater.module.css";
import { settings } from "../../../main.js";
const LOGO_URL = "https://github.com/Legcord/Branding/raw/main/assets/legcord-banner.png"; // Replace with your logo
const {
    ui: {
        showToast
    },
} = shelter;


const HeroUpdater = () => {
    const [checking, setChecking] = createSignal(false);
    const [readyForUpdate, setReadyForUpdate] = createSignal(false);
    const [updateAvailable, setUpdateAvailable] = createSignal<boolean | null>(null);

    // If auto update is enabled, we don't need to show the hero updater. 
    // TODO: Make it return the hero still but with a different message. I can't be bothered lol. - imide
    if (settings.autoUpdate) { return null } 

    // Listen for updates. People **shouldnt have to** click the button to check for updates now but I know some people prefer it (like me) - imide
    updater.on("update-available", () => {
        setUpdateAvailable(true);
        setReadyForUpdate(false);
        showToast({
            title: "Update Available",
            content: "A new update is available. Head to Legcord Settings for more info.",
            duration: 3000,
        });
    });
    updater.on("update-not-available", () => {
        setUpdateAvailable(false);
        setReadyForUpdate(false);
    });
    updater.on("update-downloaded", () => {
        setUpdateAvailable(true);
        setReadyForUpdate(true);
        showToast({
            title: "Update Downloaded",
            content: "The update has been downloaded and is ready to install. Click the button or quit Legcord to install it.",
            duration: 3000,
        });
    });

    // handleCheck is for when a user clicks the button to check for updates. It should be automatic but for the sake of 'press button, do something' satisfaction it is here. - imide
    const handleCheck = async () => {
        setChecking(true);
        setUpdateAvailable(null);
        const available = await updater.checkForUpdates();
        setUpdateAvailable(available !== null);
        setChecking(false);
    }

    const handleDownload = () => {
        updater.downloadUpdate();
        setReadyForUpdate(true);
        setUpdateAvailable(true)
    }

    // When an update is available and downloaded, it is set as 'readyForUpdate'. User can then click the button to install the update.
    const handleUpdate = () => {
        updater.quitAndInstall();
    }

    return (
        <div style={classes.hero}>
            <img src={LOGO_URL} alt="Logo" style={{ width: "96px", "margin-bottom": "1rem" }} />
            <h2>Update Checker</h2>
            <p>Check if a new version is available and download updates easily.</p>
            <button type="button" onClick={handleCheck} disabled={checking()}>
                {checking() ? "Checking..." : "Check for Updates"}
            </button>
            <Switch>
                <Match when={updateAvailable() && !readyForUpdate()}>
                    <div style={{ margin: "1rem 0", color: "green" }}>
                        <p>Update available!</p>
                        <button type="button" onClick={handleDownload}>
                            Download Update
                        </button>
                    </div>
                </Match>
                <Match when={updateAvailable() && readyForUpdate()}>
                    <div style={{ margin: "1rem 0", color: "green" }}>
                        <p>Update ready to install!</p>
                        <button type="button" onClick={handleUpdate}>
                            Install Update
                        </button>
                    </div>
                </Match>
                <Match when={!updateAvailable()}>
                    <div style={{ margin: "1rem 0", color: "gray" }}>
                        <p>Your app is up to date.</p>
                    </div>
                </Match>
            </Switch>
           
        </div>
    )
}



// const HeroUpdater = () => {
//     const [checking, setChecking] = createSignal(false);
//     const [updateAvailable, setUpdateAvailable] = createSignal<boolean | null>(null);

//     const handleCheck = async () => {
//         setChecking(true);
//         setUpdateAvailable(null);
//         const available = await updater.checkForUpdates();
//         setUpdateAvailable(available !== null);
//         setChecking(false);
//     };

//     return (
//         <div style={classes.hero}>
//             <img src={LOGO_URL} alt="Logo" style={{ width: "96px", "margin-bottom": "1rem" }} />
//             <h2>Update Checker</h2>
//             <p>Check if a new version is available and download updates easily.</p>
//             <button type="button" onClick={handleCheck} disabled={checking()}>
//                 {checking() ? "Checking..." : "Check for Updates"}
//             </button>
//             {updateAvailable() === true && (
//                 <div style={{ margin: "1rem 0", color: "green" }}>
//                     <p>Update available!</p>
//                     <button type="button" onClick={() => updater.downloadUpdate()}>
//                         Download Update
//                     </button>
//                 </div>
//             )}
//             {updateAvailable() === false && (
//                 <div style={{ margin: "1rem 0", color: "gray" }}>
//                     <p>Your app is up to date.</p>
//                 </div>
//             )}
//         </div>
//     );
// };

export default HeroUpdater;
