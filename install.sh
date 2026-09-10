#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

name=$(sed -n 's/^[[:space:]]*"Id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' metadata.json | head -n1)

if [[ -z "$name" ]]; then
    echo "Could not determine the KWin script id from metadata.json." >&2
    exit 1
fi

if ! command -v kpackagetool6 >/dev/null 2>&1; then
    echo "kpackagetool6 was not found. This version requires KDE Plasma 6 / KWin 6." >&2
    exit 1
fi

if ! kpackagetool6 --type=KWin/Script --install .; then
    kpackagetool6 --type=KWin/Script --upgrade .
fi

kwriteconfig6 --file kwinrc --group Plugins --key "${name}Enabled" true

if command -v qdbus6 >/dev/null 2>&1; then
    qdbus6 org.kde.KWin /KWin reconfigure
elif command -v qdbus >/dev/null 2>&1; then
    qdbus org.kde.KWin /KWin reconfigure
else
    echo "Installed and enabled. Log out and back in, or reconfigure KWin manually, to load it." >&2
fi
