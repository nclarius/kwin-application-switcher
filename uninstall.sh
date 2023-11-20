#!/usr/bin/env bash


# This is a script to remove the "Application Switcher" KWin script

exit_w_error() {
    local msg="$1"
    echo -e "\n(EE) ERROR: ${msg} Exiting...\n"
    exit 1
}

remove_w_kpackagetool6() {
    if command -v kpackagetool6 &> /dev/null; then
        echo "Removing 'Application Switcher' KWin script."
        kpackagetool6 --type=KWin/Script --remove .
    else
        exit_w_error "The 'kpackagetool6' command is missing. Cannot remove KWin script."
    fi
}

remove_w_kpackagetool5() {
    if command -v kpackagetool5 &> /dev/null; then
        echo "Removing 'Application Switcher' KWin script."
        kpackagetool5 --type=KWin/Script --remove .
    else
        exit_w_error "The 'kpackagetool5' command is missing. Cannot remove KWin script."
    fi
}

KDE_ver=${KDE_SESSION_VERSION:-0}


if [[ $KDE_ver -eq 6 ]]; then
    if remove_w_kpackagetool6; then
        echo "KWin script removed."
    fi
elif [[ ${KDE_ver} -eq 5 ]]; then
    if remove_w_kpackagetool5; then
        echo "KWin script removed."
    fi
else
    exit_w_error "KDE version not recognized. Cannot remove KWin script."
fi


# We need to gracefully cascade through common D-Bus utils to 
# find one that is available to use for the KWin reconfigure 
# command. Sometimes 'qdbus' is not available.

# Array of command names of common D-Bus utilities
dbus_commands=("qdbus" "gdbus" "dbus-send")

reconfigure_w_qdbus() {
    qdbus org.kde.KWin /KWin reconfigure
}

reconfigure_w_gdbus() {
    gdbus call --session --dest org.kde.KWin --object-path /KWin --method org.kde.KWin.reconfigure
}

reconfigure_w_dbus_send() {
    dbus-send --session --type=method_call --dest=org.kde.KWin /KWin org.kde.KWin.reconfigure
}

# Iterate through the dbus_commands array
for cmd in "${dbus_commands[@]}"; do
    if command -v "${cmd}" &> /dev/null; then
        # Call the corresponding function based on the command
        case "$cmd" in
            qdbus)              reconfigure_w_qdbus &> /dev/null;;
            gdbus)              reconfigure_w_gdbus &> /dev/null ;;
            dbus-send)          reconfigure_w_dbus_send &> /dev/null ;;
        esac
        # Break out of the loop once a command is found and executed
        break
    fi
done
