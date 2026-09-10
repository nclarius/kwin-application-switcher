/*
KWin Script Application Switcher
(C) 2022-2023 Natalie Clarius <natalie_clarius@yahoo.de>
Plasma 6 / KWin 6 port
GNU General Public License v3.0
*/

///////////////////////
// initialization
///////////////////////

const debugMode = readConfig("debugMode", false);

function debug(...args) {
    if (debugMode) {
        console.debug("applicationswitcher:", ...args);
    }
}

debug("initializing");


///////////////////////
// special applications to ignore
///////////////////////

const ignoredApps = [
    "plasmashell",
    "org.kde.plasmashell", // desktop shell
    "krunner",
    "org.kde.krunner", // KRunner
    "kwin_wayland", // lock screen / KWin internal windows
    "org.kde.ksmserver-logout-greeter", // logout screen
    "ksplashqml" // login splash screen
];


///////////////////////
// helpers
///////////////////////

function getApp(window) {
    if (!window) {
        return "";
    }

    return String(window.resourceClass || "");
}

function isOnCurrentDesktop(window) {
    return window.desktops.length === 0 || window.desktops.includes(workspace.currentDesktop);
}

function isOnCurrentActivity(window) {
    return window.activities.length === 0 || window.activities.includes(workspace.currentActivity);
}

function isVisibleHere(window) {
    return window &&
        !window.deleted &&
        !window.minimized &&
        isOnCurrentDesktop(window) &&
        isOnCurrentActivity(window);
}


///////////////////////
// keep track of active application
///////////////////////

let prevActiveApp = "";

function setPrevActiveApp(window) {
    if (!window) {
        return;
    }

    prevActiveApp = getApp(window);
}

function getPrevActiveApp() {
    return prevActiveApp;
}

setPrevActiveApp(workspace.activeWindow);


///////////////////////
// keep track of windows belonging to the same application
///////////////////////

// {"dolphin": [oldest window, ..., most recent window], "konsole": ...}
const appGroups = {};

function updateAppGroups(window) {
    if (!window) {
        return;
    }

    const app = getApp(window);
    if (!app) {
        return;
    }

    if (!appGroups[app]) {
        appGroups[app] = [];
    }

    appGroups[app] = appGroups[app].filter(candidate =>
        candidate && !candidate.deleted && candidate !== window
    );
    appGroups[app].push(window);

    debug("updating app group", app, appGroups[app].map(candidate => candidate.caption));
}

function removeFromAppGroups(window) {
    if (!window) {
        return;
    }

    for (const app in appGroups) {
        appGroups[app] = appGroups[app].filter(candidate =>
            candidate && !candidate.deleted && candidate !== window
        );

        if (appGroups[app].length === 0) {
            delete appGroups[app];
        }
    }
}

function getAppGroup(window) {
    if (!window) {
        return [];
    }

    const app = getApp(window);
    const group = (appGroups[app] || []).filter(isVisibleHere);

    debug("getting app group", app, group.map(candidate => candidate.caption));
    return group;
}

// Compute groups for windows already present when the script starts.
workspace.windowList().forEach(updateAppGroups);

// Keep bookkeeping current as windows are created and destroyed.
workspace.windowAdded.connect(updateAppGroups);
workspace.windowRemoved.connect(removeFromAppGroups);


///////////////////////
// main
///////////////////////

workspace.windowActivated.connect(active => {
    if (!active) {
        return;
    }

    const app = getApp(active);

    debug("---------");
    debug("activated", active.caption);
    debug("app", app);

    if (!app || ignoredApps.includes(app)) {
        debug("ignored");
        return;
    }

    updateAppGroups(active);

    debug("previous app", getPrevActiveApp());

    // Only raise the group when entering a different application. Switching
    // between windows of the same application must not reshuffle the group.
    if (app === getPrevActiveApp()) {
        return;
    }

    debug("app switched");
    setPrevActiveApp(active);

    // KWin 6 exposes raiseWindow(), so the other windows can be brought to
    // the front without temporarily moving keyboard focus through each one.
    // The active window is the most recently activated member and therefore
    // the last one raised, preserving it as the top window of the group.
    for (const window of getAppGroup(active)) {
        debug("auto-raising", window.caption);
        workspace.raiseWindow(window);
    }
});
