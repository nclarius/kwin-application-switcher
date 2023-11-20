#!/usr/bin/env bash


# This is a script to install the "Application Switcher" KWin script

exit_w_error() {
    local msg="$1"
    echo -e "\n(EE) ERROR: ${msg} Exiting...\n"
    exit 1
}

install_w_kpackagetool6() {
    echo "Installing KWin script: '${script_name}'"
    if ! kpackagetool6 --type="${script_type}" --install "${script_path}" &> /dev/null; then
        kpackagetool6 --type="${script_type}" --upgrade "${script_path}"
    fi
}

install_w_kpackagetool5() {
    echo "Installing KWin script: '${script_name}'"
    if ! kpackagetool5 --type="${script_type}" --install "${script_path}" &> /dev/null; then
        kpackagetool5 --type="${script_type}" --upgrade "${script_path}"
    fi
}

KDE_ver=${KDE_SESSION_VERSION:-0}
script_type="KWin/Script"
script_path="."
script_name=$(grep -oP '"Id":\s*"[^"]*' ./metadata.json | grep -oP '[^"]*$')

if [[ ${KDE_ver} -eq 6 ]]; then
    if command -v kpackagetool6 &> /dev/null; then
        if install_w_kpackagetool6; then
            if command -v kwriteconfig6 &> /dev/null; then
                kwriteconfig6 --file kwinrc --group Plugins --key "$script_name"Enabled true
            else
                exit_w_error "The 'kwriteconfig6' command was not found. Cannot enable KWin script."
            fi
        else
            exit_w_error "Problem installing '${script_name}' with kpackagetool6."
        fi
    else
        echo "The 'kpackagetool6' command was not found. Cannot install KWin script."
    fi
elif [[ ${KDE_ver} -eq 5 ]]; then
    if command -v kpackagetool5 &> /dev/null; then
        if install_w_kpackagetool5; then
            if command -v kwriteconfig5 &> /dev/null; then
                kwriteconfig5 --file kwinrc --group Plugins --key "$script_name"Enabled true
            else
                exit_w_error "The 'kwriteconfig5' command was not found. Cannot enable KWin script."
            fi
        else
            exit_w_error "Problem installing '${script_name}' with kpackagetool5."
        fi
    else
        exit_w_error "The 'kpackagetool5' command was not found."
    fi
else
    exit_w_error "KDE version not recognized. Cannot install the KWin script."
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

echo "Finished installing KWin script: '${script_name}'"
