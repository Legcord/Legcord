
<div align="center">
<img src="https://armcord.vercel.app/armcord_full_logo.png" width="720">
 <br>ArmCord is a custom client designed to enhance your Discord experience while keeping everything lightweight. 
</div>

# Features

- **Standalone client** 

   ArmCord is built as standalone client, it doesn't rely on original Discord client.


- **Various mods built in**
 
   Explore Cumcord/GooseMod/Flicker plugins and their features!


- **Made for Privacy**

   ArmCord automatically blocks Discord's trackers.


- **Faster than normal Discord app**

   ArmCord is using newer Electron than stock Discord app. This usually means increased performance and more stable experience.


- **Designed to work anywhere**

   ArmCord was initially created in mind to run on Arm64 Linux devices. We soon expanded our support to more platforms. We plan to support every platform that [Electron supports](https://www.electronjs.org/docs/latest/tutorial/support#supported-platforms).
  
# How to run/install it?
### Recommended:
 Check releases tab for precompiled packages for Linux, Windows and ~~Mac OS~~ (Mac OS is broken see [#48](https://github.com/ArmCord/ArmCord/issues/48)). Alternatively use our Sourceforge mirror.  
 <a href="https://sourceforge.net/projects/armcord/files/latest/download"><img alt="Download ArmCord" src="https://a.fsdn.com/con/app/sf-download-button" width=276 height=48 srcset="https://a.fsdn.com/con/app/sf-download-button?button_size=2x 2x"></a>
### AUR Package
Armcord is also available on the Arch User Repository (AUR) [here](https://aur.archlinux.org/packages/armcord-bin/).

Install it via an AUR helper tool like `yay`.

**Example:** `yay -S armcord-bin`

### Manual:
 Alternatively you can run ArmCord from source (npm, nodejs required):    
 1. Clone ArmCord repo: `git clone https://github.com/ArmCord/ArmCord.git`    
 2. Run `npm install` to install dependencies   
 3. Compile/Package with `npm run package`    


# FAQ
## 1. Will I get banned from using it?   

 -You are breaking Discord ToS if you decided to use client mods. But no one ever got banned from using ArmCord or any of the client mods included. If you wish to remove mods, check our documentation. 
## 2. How does this work?   

 -We are using official web app and adding some magic powder to make it all work!   
## 3. Can I use this on other architectures or operating systems?

 -Yes! ArmCord should work normally under Windows, ~~Mac OS~~ (Mac OS is broken see [#48](https://github.com/ArmCord/ArmCord/issues/48)) and Linux as long as it has NodeJS, npm and Electron support.   

# Credits
[ArmCord UI Elements and few features](https://github.com/kckarnige)   
[Cumcord](https://github.com/Cumcord/Cumcord)   
[GooseMod](https://github.com/GooseMod/GooseMod) 
[GooseMod Extension](https://github.com/GooseMod/extension)    
[electron-discord-webapp](https://github.com/SpacingBat3/electron-discord-webapp)    
[custom-electron-titlebar (css only)](https://github.com/AlexTorresSk/custom-electron-titlebar)    
[electron-builder](https://electron.build)    
