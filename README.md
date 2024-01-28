
<div align="center">
<img src="https://armcord.app/logo.png" width="520">
 <br>ArmCord is a custom client designed to enhance your Discord experience while keeping everything lightweight. 
</div>

# Features

- **Standalone client** 

   ArmCord is built as a standalone client and doesn't rely on the original Discord client in any way.

- **Various mods built-in**
 
   Enjoy [Vencord](https://github.com/Vendicated/Vencord), [Shelter](https://github.com/uwu/shelter) and their many features, or have a more vanilla experience, it's your choice!

- **Themes**

   ArmCord natively supports theming of the entire app, you can easily import BetterDiscord themes and manage them

- **Made for Privacy™**

   ArmCord automatically blocks all of Discord's trackers; even without any client mods, you can feel safe and secure!

- **Supports Rich Presence**

   Unlike other clients, ArmCord supports rich presence (game activity) out of the box thanks to [arRPC](https://arrpc.openasar.dev).
   
- **Mobile support**

   ArmCord has **experimental** mobile support for phones running Linux such as the PinePhone. While this is still far from an ideal solution, we're slowly trying to improve it.

- **Much more stable**

   ArmCord is using a newer build of Electron than the stock Discord app. This means you can have a much more stable and secure experience, along with slightly better performance.


- **Cross-platform support!**

   ArmCord was originally created for ARM64 Linux devices since Discord doesn't support them. We soon decided to support every platform that [Electron supports](https://github.com/electron/electron#platform-support)!
  
# How to run/install it?

## Packaging status
[![Packaging status](https://repology.org/badge/vertical-allrepos/armcord.svg)](https://repology.org/project/armcord/versions)

### Windows
<a href="https://microsoft.com/store/apps/9PFHLJFD7KJT">
   <img src="https://get.microsoft.com/images/en-us%20dark.svg" alt="Download ArmCord" />
</a>

If you're using an older version of Windows, you need to use [pre-built installers](https://www.armcord.app/download).

### Flatpak
<a href='https://flathub.org/apps/details/xyz.armcord.ArmCord'><img width='240' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.svg'/></a>

### Debian, Ubuntu and Raspbian repository
ArmCord is available on our official repositories for `apt` package manager. By using this method you'll receive automatic updates and get all the dependencies. Run the following commands to install ArmCord from them:
```sh
curl -fsSL https://apt.armcord.app/public.gpg | sudo gpg --dearmor -o /usr/share/keyrings/armcord.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/armcord.gpg] https://apt.armcord.app/ stable main" | sudo tee /etc/apt/sources.list.d/armcord.list
sudo apt update
sudo apt install armcord
```
If you previously used old ArmCord apt repo, here's how you can remove it:
```sh
sudo rm /etc/apt/sources.list.d/armcord.list
sudo rm /usr/share/keyrings/armcord.gpg
sudo apt update
```
### Snap package
ArmCord is also available on the Snap store [here](https://snapcraft.io/armcord).   
<a href="https://snapcraft.io/armcord">
<img alt="Get it from the Snap Store" src="https://snapcraft.io/static/images/badges/en/snap-store-black.svg" />
</a>  

Similar to `armcord-git` on AUR, you can install the latest dev builds through snaps by running this command:
```shell
sudo snap install armcord --channel=latest/edge
```
Snapd will automatically update the app including developer builds.
### Winget Package
ArmCord is also available on the [winget-pkgs](https://github.com/microsoft/winget-pkgs) repository:
```
winget install ArmCord.ArmCord
```
### Scoop package
ArmCord is also available on [Scoop extras](https://github.com/ScoopInstaller/Extras) repo:
```
scoop bucket add extras
```
```
scoop install armcord
```
### AUR Package
ArmCord is also available on the Arch User Repository (AUR):
- [armcord-bin](https://aur.archlinux.org/packages/armcord-bin) - ArmCord Release ~ Static binary from release, stable release only
- [armcord-git](https://aur.archlinux.org/packages/armcord-git) - ArmCord Dev ~ Latest devbuild built from source (takes ~1 minute) using the system electron

Install it via an AUR helper tool like `yay`.

**Example:** `yay -S armcord-bin`
### FreeBSD
You can also get ArmCord running on FreeBSD by following [these instructions](https://gist.github.com/txxlchains/4d29c982ac85d5d26f98a51040b5de37).
### Pi-Apps
ArmCord is also available in [Pi-Apps](https://github.com/Botspot/pi-apps).  
[![badge](https://github.com/Botspot/pi-apps/blob/master/icons/badge.png?raw=true)](https://github.com/Botspot/pi-apps)

### Pre-built binaries:
 Check the **releases tab** for precompiled packages for Linux, Windows, and Mac OS. Alternatively, use our Sourceforge mirror.  
 <a href="https://sourceforge.net/projects/armcord/files/latest/download"><img alt="Download ArmCord" src="https://a.fsdn.com/con/app/sf-download-button" width=276 height=48 srcset="https://a.fsdn.com/con/app/sf-download-button?button_size=2x 2x"></a>

### Compiling:
 Alternatively, you can run ArmCord from source ([NodeJS](https://nodejs.dev), [pnpm](https://pnpm.io/installation#using-npm), and [rust toolchain](https://www.rust-lang.org/tools/install) are required):    
 1. Clone ArmCord repo: `git clone https://github.com/ArmCord/ArmCord.git`    
 2. Run `pnpm install` to install dependencies   
 3. Build with `npm run build`   
 4. Compile/Package with `npm run package`    


# FAQ
## Do you have a support Discord?

[![](https://dcbadge.vercel.app/api/server/TnhxcqynZ2)](https://discord.gg/TnhxcqynZ2)
## Will I get banned for using this?   
- You are breaking [Discord ToS](https://discord.com/terms#software-in-discord%E2%80%99s-services) by using ArmCord, but no one has been banned from using it or any of the client mods included.

## Can I use this on anything other than ARM?
- Yes! ArmCord should work normally under Windows, MacOS, and Linux as long as it has Electron support.  

## How can I access the settings?
- Either right-click on the tray icon and click `Open Settings` or open Discord settings and scroll down the sidebar until you see information about versions. Click on the ArmCord version and the settings window will pop out.

## How does this work?   
- We are using the official web app and wrapping it up in Electron. While you may think this is lame and done like thousands of times before, what makes us unique is that we actually strive for creating a customized experience. You can very easily load themes and mods with no installers/injectors. You can even make the client have transparency effects and follow the fluent design of Windows! At its core, it's just a simple web wrapper, however, we applied many patches to make this work well for you <3

## Why is macOS support lacking?
- Due to me not owning any macOS device, I can't easily debug/test or do anything related to it. Of course, VMs and Hackintosh machines exist but from my experience, these are unreliable or very time-consuming to set up and maintain. While ArmCord "works" on macOS you may encounter weird issues or inconsistencies with other apps in terms of how they behave (for example macOS lack of tray).

## Where can I find the source code?
- The source code is on [GitHub](https://github.com/ArmCord/ArmCord/).

## Where can I translate this?
- Translations are done using our [Weblate page](https://hosted.weblate.org/projects/armcord/armcord/).

# Credits
- [ArmCord UI design, branding, and a few features](https://github.com/kckarnige)
- [OpenAsar](https://github.com/GooseMod/OpenAsar)
- [arRPC (for Rich Presence)](https://github.com/OpenAsar/arrpc)
- (pre v3.1.0) [Cumcord](https://github.com/Cumcord/Cumcord)
- (pre v3.1.0) [GooseMod](https://github.com/GooseMod/GooseMod)
- (pre v3.1.0) [GooseMod Extension](https://github.com/GooseMod/extension)
- (pre v3.1.0) [FlickerMod](https://github.com/FlickerMod)
- (Pre v3.0.0) [custom-electron-titlebar](https://github.com/AlexTorresSk/custom-electron-titlebar)
- [electron-builder](https://electron.build)
  
Discord is trademark of Discord Inc. ArmCord is not affiliated with or endorsed by Discord Inc. 
