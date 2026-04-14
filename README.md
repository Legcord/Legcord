
<div align="center">

![Legcord](https://github.com/user-attachments/assets/f7b007d4-44fa-4c88-96e4-0a448b568b5d)

**Legcord is a custom client designed to enhance your Discord experience while keeping everything lightweight.**

[![GitHub Release](https://img.shields.io/github/v/release/Legcord/Legcord?style=for-the-badge&logo=github&color=5865F2)](https://github.com/Legcord/Legcord/releases)
[![Downloads](https://img.shields.io/github/downloads/Legcord/Legcord/total?style=for-the-badge&logo=github&color=5865F2)](https://github.com/Legcord/Legcord/releases)
[![Discord](https://img.shields.io/discord/1015721033789472810?style=for-the-badge&logo=discord&logoColor=white&label=Discord&color=5865F2)](https://discord.gg/TnhxcqynZ2)
[![License](https://img.shields.io/github/license/Legcord/Legcord?style=for-the-badge&color=5865F2)](license.txt)

</div>

---

## Table of Contents

- [Features](#-features)
- [Installation](#-how-to-runinstall-it)
- [FAQ](#-faq)
- [Credits](#-credits)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🖥️ Standalone client

Legcord is built as a standalone client and doesn't rely on the original Discord client in any way.

### 🧩 Various mods built-in

Enjoy [Vencord](https://github.com/Vendicated/Vencord), [Equicord](https://github.com/Equicord/Equicord), [Shelter](https://github.com/uwu/shelter) and their many features, or have a more vanilla experience, it's your choice!

### 🎨 Themes

Legcord natively supports theming of the entire app, you can easily import BetterDiscord themes and manage them

### 🔒 Made for Privacy™

Legcord automatically blocks all of Discord's trackers; even without any client mods, you can feel safe and secure!

</td>
<td width="50%">

### 🎮 Supports Rich Presence

Unlike other clients, Legcord supports rich presence (game activity) out of the box thanks to [arRPC](https://arrpc.openasar.dev).

### 📱 Mobile support

Legcord has **experimental** mobile support for phones running Linux such as the PinePhone. While this is still far from an ideal solution, we're slowly trying to improve it.

### 🛡️ Much more stable

Legcord is using a newer build of Electron than the stock Discord app. This means you can have a much more stable and secure experience, along with slightly better performance.

### 🌍 Cross-platform support!

Legcord was originally created for AArch64 Linux devices since Discord doesn't support them. We soon decided to support every platform that [Electron supports](https://github.com/electron/electron#platform-support)!

</td>
</tr>
</table>

---

## 📦 How to run/install it?

### Packaging status

[![Packaging status](https://repology.org/badge/vertical-allrepos/legcord.svg)](https://repology.org/project/legcord/versions)

<details>
<summary><img src="https://img.shields.io/badge/Windows-0078D4?style=flat-square&logo=windows&logoColor=white" height="20" /> <b>Windows</b></summary>

#### Windows

[Get the .exe installer](https://www.legcord.app/download)

[<img src="https://user-images.githubusercontent.com/49786146/159123313-3bdafdd3-5130-4b0d-9003-40618390943a.png" width="200" />](https://winstall.app/apps/smartfrigde.Legcord)

```pwsh
winget install --id=smartfrigde.Legcord  -e
```

[<img src="https://learn.microsoft.com/en-us/windows/apps/images/new-badge-light.png" width="200" />](https://apps.microsoft.com/detail/9pdkjpv0wxlg?ocid=webpdpshare)

</details>

<details>
<summary><img src="https://img.shields.io/badge/Flatpak-4A90D9?style=flat-square&logo=flatpak&logoColor=white" height="20" /> <b>Flatpak</b></summary>

#### Flatpak

Not available yet.

</details>

<details>
<summary><img src="https://img.shields.io/badge/Debian%20%2F%20Ubuntu-A81D33?style=flat-square&logo=debian&logoColor=white" height="20" /> <b>Debian, Ubuntu and Raspbian</b></summary>

#### Debian, Ubuntu and Raspbian

##### Install via .deb from GitHub Releases

You can install Legcord directly using the `.deb` packages published on the GitHub Releases page.

1. Go to the Releases page: https://github.com/Legcord/Legcord/releases
2. Download the `.deb` that matches your architecture:
   - `amd64` (most Intel/AMD 64‑bit PCs)
   - `arm64` (AArch64, e.g. Raspberry Pi 4/5 64‑bit, ARM laptops)
3. Install the downloaded file (this resolves dependencies automatically):

```sh
sudo apt install ./<downloaded-file>.deb
```

Alternatively, you can copy the asset link from the release and install via terminal:

```sh
# Replace the URL below with the copied link to the .deb asset from the Releases page
wget -O legcord.deb "https://github.com/Legcord/Legcord/releases/download/<tag>/<asset>.deb"
sudo apt install legcord.deb
```

If your system reports missing dependencies, you can also use this fallback:

```sh
sudo dpkg -i <downloaded-file>.deb || sudo apt -f install
```

##### Alternative: pacstall

legcord-deb is available on [pacstall](https://pacstall.dev/packages/legcord-deb)
```sh
sudo bash -c "$(wget -q https://pacstall.dev/q/install -O -)" # Install pacstall if not installed
pacstall -I legcord-deb
```

</details>

<details>
<summary><img src="https://img.shields.io/badge/Snap-82BEA0?style=flat-square&logo=snapcraft&logoColor=white" height="20" /> <b>Snap</b></summary>

#### Snap package

[![Get it from the Snap store](https://assets.ubuntu.com/v1/b16729d2-snap-store-black.svg)](https://snapcraft.io/legcord)

</details>

<details>
<summary><img src="https://img.shields.io/badge/Scoop-B5E2FA?style=flat-square&logo=windows-terminal&logoColor=black" height="20" /> <b>Scoop</b></summary>

#### Scoop package

Legcord is also available on the [Extras](https://github.com/ScoopInstaller/Extras) repo

```powershell
scoop bucket add extras # Ensure bucket is added first
scoop install legcord
```

</details>

<details>
<summary><img src="https://img.shields.io/badge/AUR-1793D1?style=flat-square&logo=archlinux&logoColor=white" height="20" /> <b>AUR (Arch Linux)</b></summary>

#### AUR Package

- [legcord-git](https://aur.archlinux.org/packages/legcord-git) Built locally against dev branch

</details>

<details>
<summary><img src="https://img.shields.io/badge/Homebrew-FBB040?style=flat-square&logo=homebrew&logoColor=black" height="20" /> <b>Homebrew</b></summary>

#### Homebrew repository

Legcord is also available on the [Homebrew Cask](https://github.com/Homebrew/homebrew-cask) repo

```zsh
brew install --cask legcord
```

</details>

<details>
<summary><img src="https://img.shields.io/badge/MacPorts-42A5F5?style=flat-square&logo=apple&logoColor=white" height="20" /> <b>MacPorts</b></summary>

#### MacPorts

Legcord is available [via MacPorts](https://ports.macports.org/port/Legcord/)

```sh
sudo port install legcord
```

</details>

<details>
<summary><img src="https://img.shields.io/badge/FreeBSD-AB2B28?style=flat-square&logo=freebsd&logoColor=white" height="20" /> <b>FreeBSD</b></summary>

#### FreeBSD

You can also get Legcord running on FreeBSD by following [these instructions](https://gist.github.com/axyiee/4d29c982ac85d5d26f98a51040b5de37).

</details>

<details>
<summary><img src="https://img.shields.io/badge/Pi--Apps-C51A4A?style=flat-square&logo=raspberrypi&logoColor=white" height="20" /> <b>Pi-Apps</b></summary>

#### Pi-Apps

Legcord is also available in [Pi-Apps](https://github.com/Botspot/pi-apps).  
[![badge](https://github.com/Botspot/pi-apps/blob/master/icons/badge.png?raw=true)](https://github.com/Botspot/pi-apps)

</details>

<details>
<summary><b>📂 Pre-built binaries</b></summary>

#### Pre-built binaries

 Check the **[releases tab](https://github.com/Legcord/Legcord/releases)** for precompiled packages for Linux, Windows, and macOS.

</details>

<details>
<summary><b>🔧 Compiling from source</b></summary>

#### Compiling

 Alternatively, you can run Legcord from source ([NodeJS](https://nodejs.dev) and [pnpm](https://pnpm.io/installation#using-npm)) are required:

 1. Clone Legcord repo: `git clone https://github.com/Legcord/Legcord.git`
 2. Run `pnpm install` to install dependencies
 3. Build with `pnpm run build`
 4. Compile/Package with `pnpm run package`

</details>

---

## ❓ FAQ

<details>
<summary><b>Do you have a support Discord?</b></summary>

[![Discord Server](https://dcbadge.vercel.app/api/server/TnhxcqynZ2)](https://discord.gg/TnhxcqynZ2)

</details>

<details>
<summary><b>Will I get banned for using this?</b></summary>

- You are breaking [Discord ToS](https://discord.com/terms#software-in-discord%E2%80%99s-services) by using Legcord, but no one has been banned from using it or any of the client mods included.

</details>

<details>
<summary><b>How can I access the settings?</b></summary>

- Open Discord settings and there should be a button `Legcord Settings` button with a white Discord icon, you can also right click on the tray icon and click `Open Settings`

</details>

<details>
<summary><b>How does this work?</b></summary>

- We utilize the official web app and package it within Electron. While this approach may seem familiar, our focus is on delivering a truly customized and enhanced experience. Unlike many others, we provide seamless integration for loading themes and mods without the need for installers or injectors. You can easily enable transparency effects and adopt Windows' Fluent Design, offering a modern and sleek interface. Though it's fundamentally a web wrapper, we have implemented numerous optimizations and patches to ensure a smooth and tailored experience for you.

</details>

<details>
<summary><b>Does Legcord have a portable mode for windows?</b></summary>

- Yes it does! Simply add a folder called "legcord-data" in the folder where your legcord executable is located and start Legcord. Make sure to download the archive/zip file.

</details>

<details>
<summary><b>Where can I find the source code?</b></summary>

- The source code is on [GitHub](https://github.com/Legcord/Legcord/).

</details>

<details>
<summary><b>Where can I translate this?</b></summary>

- Translations are done using our [Weblate page](https://hosted.weblate.org/projects/armcord/).

</details>

---

## 🙏 Credits

| Contribution | Link |
|---|---|
| Legcord UI design, branding, and a few features | [@kckarnige](https://github.com/kckarnige) |
| OpenAsar | [GooseMod/OpenAsar](https://github.com/GooseMod/OpenAsar) |
| arRPC (for Rich Presence) | [OpenAsar/arrpc](https://github.com/OpenAsar/arrpc) |
| electron-builder | [electron.build](https://electron.build) |

---

<div align="center">
<sub>

Discord is trademark of Discord Inc. Legcord is not affiliated with or endorsed by Discord Inc.
Legcord is not affiliated with or endorsed by ARM Limited.

</sub>
</div>
