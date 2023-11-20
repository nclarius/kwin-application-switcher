#!/usr/bin/env bash


# This is a script to install the "Application Switcher" KWin script


exit_w_error() {
    local msg="$1"
    echo -e "\n(EE) ERROR: ${msg} Exiting...\n"
    exit 1
}

script_name=$(grep -oP '"Id":\s*"[^"]*' ./metadata.json | grep -oP '[^"]*$')

if command -v "kpackagetool5"; then
    kpackagetool5 --type=KWin/Script --install . || kpackagetool5 --type=KWin/Script --upgrade .
else
    exit_w_error "The 'kpackagetool5' command was not found."
fi

if command -v "kwriteconfig5"; then
    kwriteconfig5 --file kwinrc --group Plugins --key "$script_name"Enabled true
else
    exit_w_error "The 'kwriteconfig5' command was not found."
fi

# We need to gracefully cascade through common D-Bus utils to find one that is available.

# Array of command names of common D-Bus utilities
dbus_commands=("qdbus" "gdbus" "dbus-send")

# Function to reconfigure KWin using qdbus
reconfigure_with_qdbus() {
    qdbus org.kde.KWin /KWin reconfigure
}

# Function to reconfigure KWin using gdbus
reconfigure_with_gdbus() {
    gdbus call --session --dest org.kde.KWin --object-path /KWin --method org.kde.KWin.reconfigure
}

# Function to reconfigure KWin using dbus-send
reconfigure_with_dbus_send() {
    dbus-send --session --type=method_call --dest=org.kde.KWin /KWin org.kde.KWin.reconfigure
}

# Iterate through the dbus_commands array
for cmd in "${dbus_commands[@]}"; do
    if command -v "$cmd" &> /dev/null; then
        # Call the corresponding function based on the command
        case "$cmd" in
            qdbus)      reconfigure_with_qdbus ;;
            gdbus)      reconfigure_with_gdbus ;;
            dbus-send)  reconfigure_with_dbus_send ;;
        esac
        # Break out of the loop once a command is found and executed
        break
    fi
done
