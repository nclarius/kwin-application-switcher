#!/bin/bash
name=$(grep -oP '(?<=X-KDE-PluginInfo-Name=).*' ./metadata.desktop)
kwriteconfig5 --file kwinrc --group Script-"$name" --key debugMode true
qdbus org.kde.KWin /KWin reconfigure
