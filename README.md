# Legcord

# Features

- **Standalone client**

   Legcord is built as a standalone client and doesn't rely on the original Discord client in any way.

- **Various mods built-in**

   Enjoy [Vencord](https://github.com/Vendicated/Vencord), [Equicord](https://github.com/Equicord/Equicord), [Shelter](https://github.com/uwu/shelter) and their many features, or have a more vanilla experience, it's your choice!

- **Themes**

   Legcord natively supports theming of the entire app, you can easily import BetterDiscord themes and manage them

- **Made for Privacy™**

   Legcord automatically blocks all of Discord's trackers; even without any client mods, you can feel safe and secure!

- **Supports Rich Presence**

   Unlike other clients, Legcord supports rich presence (game activity) out of the box thanks to [arRPC](https://arrpc.openasar.dev).

- **Mobile support**

   Legcord has **experimental** mobile support for phones running Linux such as the PinePhone. While this is still far from an ideal solution, we're slowly trying to improve it.

- **Much more stable**

   Legcord is using a newer build of Electron than the stock Discord app. This means you can have a much more stable and secure experience, along with slightly better performance.

- **Cross-platform support!**

   Legcord was originally created for AArch64 Linux devices since Discord doesn't support them. We soon decided to support every platform that [Electron supports](https://github.com/electron/electron#platform-support)!
  
# How to run/install it?

## Packaging status

[![Packaging status](https://repology.org/badge/vertical-allrepos/Legcord.svg)](https://repology.org/project/Legcord/versions)

### Windows

<a href="https://microsoft.com/store/apps/9PFHLJFD7KJT">
   <img src="https://get.microsoft.com/images/en-us%20dark.svg" alt="Download Legcord" />
</a>

If you're using an older version of Windows, you need to use [pre-built installers](https://www.Legcord.app/download).

### Flatpak

<a href='https://flathub.org/apps/details/xyz.Legcord.Legcord'><img width='240' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.svg'/></a>

### Debian, Ubuntu and Raspbian repository

Legcord is available on our official repositories for `apt` package manager. By using this method you'll receive automatic updates and get all the dependencies. Run the following commands to install Legcord from them:

```sh
curl -fsSL https://apt.Legcord.app/public.gpg | sudo gpg --dearmor -o /usr/share/keyrings/Legcord.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/Legcord.gpg] https://apt.Legcord.app/ stable main" | sudo tee /etc/apt/sources.list.d/Legcord.list
sudo apt update
sudo apt install Legcord
```

If you previously used old Legcord apt repo, here's how you can remove it:

```sh
sudo rm /etc/apt/sources.list.d/Legcord.list
sudo rm /usr/share/keyrings/Legcord.gpg
sudo apt update
```

### Snap package

Legcord is also available on the Snap store [here](https://snapcraft.io/Legcord).   
<a href="https://snapcraft.io/Legcord">
<img alt="Get it from the Snap Store" src="https://snapcraft.io/static/images/badges/en/snap-store-black.svg" />
</a>  

Similar to `Legcord-git` on AUR, you can install the latest dev builds through snaps by running this command:

```shell
sudo snap install Legcord --channel=latest/edge
```

Snapd will automatically update the app including developer builds.

### Winget Package

Legcord is also available on the [winget-pkgs](https://github.com/microsoft/winget-pkgs) repository:

```ps1
winget install Legcord.Legcord
```

### Scoop package

Legcord is also available on [Scoop extras](https://github.com/ScoopInstaller/Extras) repo:

```ps1
scoop bucket add extras
```

```ps1
scoop install Legcord
```

### AUR Package

Legcord is also available on the Arch User Repository (AUR):

- [Legcord-bin](https://aur.archlinux.org/packages/Legcord-bin) - Legcord Release ~ Static binary from release, stable release only

- [Legcord-git](https://aur.archlinux.org/packages/Legcord-git) - Legcord Dev ~ Latest devbuild built from source (takes ~1 minute) using the system electron

Install it via an AUR helper tool like `yay`.

**Example:** `yay -S Legcord-bin`

### Homebrew repository

Legcord also has a homebrew repository

```zsh
brew tap Legcord/Legcord
```

```zsh
brew install --cask Legcord
```

### FreeBSD

You can also get Legcord running on FreeBSD by following [these instructions](https://gist.github.com/axyiee/4d29c982ac85d5d26f98a51040b5de37).

### Pi-Apps

Legcord is also available in [Pi-Apps](https://github.com/Botspot/pi-apps).  
[![badge](https://github.com/Botspot/pi-apps/blob/master/icons/badge.png?raw=true)](https://github.com/Botspot/pi-apps)

### Pre-built binaries:

 Check the **releases tab** for precompiled packages for Linux, Windows, and Mac OS. Alternatively, use our Sourceforge mirror.  

### Compiling:

 Alternatively, you can run Legcord from source ([NodeJS](https://nodejs.dev) and [pnpm](https://pnpm.io/installation#using-npm)) are required):

 1. Clone Legcord repo: `git clone https://github.com/Legcord/Legcord.git`
 2. Run `pnpm install` to install dependencies
 3. Build with `pnpm run build`
 4. Compile/Package with `pnpm run package`

# FAQ

## Do you have a support Discord?

[![](https://dcbadge.vercel.app/api/server/TnhxcqynZ2)](https://discord.gg/TnhxcqynZ2)

## Will I get banned for using this?

- You are breaking [Discord ToS](https://discord.com/terms#software-in-discord%E2%80%99s-services) by using Legcord, but no one has been banned from using it or any of the client mods included.

## Can I use this on anything other than AArch64/Apple Silicon?

- Yes! Legcord should work normally under Windows, macOS, and Linux as long as it has Electron support.  

## How can I access the settings?

- Open Discord settings and there should be a button `Legcord Settings` button with a white Discord icon, you can also right click on the tray icon and click `Open Settings`

## How does this work?

- We utilize the official web app and package it within Electron. While this approach may seem familiar, our focus is on delivering a truly customized and enhanced experience. Unlike many others, we provide seamless integration for loading themes and mods without the need for installers or injectors. You can easily enable transparency effects and adopt Windows' Fluent Design, offering a modern and sleek interface. Though it's fundamentally a web wrapper, we have implemented numerous optimizations and patches to ensure a smooth and tailored experience for you.

## Where can I find the source code?

- The source code is on [GitHub](https://github.com/Legcord/Legcord/).

## Where can I translate this?

- Translations are done using our [Weblate page](https://hosted.weblate.org/projects/Legcord/Legcord/).

# Credits

- [Legcord UI design, branding, and a few features](https://github.com/kckarnige)
- [OpenAsar](https://github.com/GooseMod/OpenAsar)
- [arRPC (for Rich Presence)](https://github.com/OpenAsar/arrpc)
- [electron-builder](https://electron.build)
  
Discord is trademark of Discord Inc. Legcord is not affiliated with or endorsed by Discord Inc.
Legcord is not affiliated with or endorsed by ARM Limited.
