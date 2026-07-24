#!/bin/bash
set -e

export DISPLAY=:99

Xvfb :99 -screen 0 1280x800x24 &
sleep 1

x11vnc -display :99 -forever -usepw -rfbport 5900 &

legcord --no-sandbox &

tail -f /dev/null