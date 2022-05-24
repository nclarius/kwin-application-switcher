#!/bin/bash

# update
kpackagetool5 --type=KWin/Script --install . || kpackagetool5 --type=KWin/Script --upgrade .

# enable
kwriteconfig5 --file kwinrc --group Plugins --key "$(grep -oP '(?<=X-KDE-PluginInfo-Name=).*' ./metadata.desktop)"Enabled true

# reload
qdbus org.kde.KWin /KWin reconfigure
source /home/natalie/kde/build/kwin/prefix.sh
/home/natalie/kde/usr/bin/kwin_"$(printenv XDG_SESSION_TYPE)" --replace
