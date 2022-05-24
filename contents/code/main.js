/*
KWin Script Application Switcher
(C) 2022 Natalie Clarius <natalie_clarius@yahoo.de>
GNU General Public License v3.0
*/

///////////////////////
// initialization
///////////////////////

const debugMode = readConfig("debugMode", true);
function debug(...args) {
    if (debugMode) { console.debug("applicationswitcher:", ...args); }
}
debug("initializing");


///////////////////////
// keep track of active application (to check whether app has been switched)
///////////////////////

// set previously active application for initially active window
// "dolphin"
var prevActiveApp = 
    workspace.activeClient ? String(workspace.activeClient.resourceClass) : "";


///////////////////////
// keep track of windows belonging to same application in order of activation
///////////////////////

// {"dolphin": [oldest window, ..., most recent window], "konsole": ...}
var appGroups = {};

// compute app groups for initially present windows
workspace.clientList().forEach(win => updateAppGroups(win));

// update app groups with recently activated window
function updateAppGroups(active) {
    if (!active) return;
    debug("updating app groups");
    let app = String(active.resourceClass);

    if (!appGroups[app]) appGroups[app] = [];
    appGroups[app] = appGroups[app].filter(w => w && w != active);
    appGroups[app].push(active);

    debug("updated; app groups:", appGroups[app].map(client => client.caption));
}

// return other visible windows of same application as recently active window
function getAppGroups(active) {
    if (!active) return;
    debug("getting app groups");
    let app = String(active.resourceClass);

    debug("fetched; app groups:", appGroups[app].map(client => client.caption));
    return appGroups[app].filter(w => !w.minimized && 
                                      (w.desktop == active.desktop ||
                                      active.onAllDesktops || w.onAllDesktops));
}


///////////////////////
// keep track of auto-raised windows
///////////////////////

// [dolphin window 1, dolphin window 2, ...]
var autoActivated = [];

function addAutoActivated(activated) {
    autoActivated = autoActivated.filter(w => w && w != activated);
    autoActivated.push(activated);
}

function delAutoActivated(activated) {
    autoActivated = autoActivated.filter(w => w && w != activated);
}

///////////////////////
// application switching
///////////////////////

// when client is activated, auto-raise other windows of the same applicaiton
workspace.clientActivated.connect(active => {
    if (!active) return;
    debug("activated", active.caption);
    // abort if current activation was due to auto-raise
    if (autoActivated.includes(active)) {
        delAutoActivated(active);
        return;
    }

    let app = String(active.resourceClass);
    updateAppGroups(active);

    // if application was switched
    if (app != prevActiveApp) {
        debug("app switched");
        // auto-raise other windows of same application
        for (const window of getAppGroups(active)) {
            debug("auto-raising", window.caption);
            addAutoActivated(window);
            workspace.activeClient = window;
        }
    }

    prevActiveApp = app;
});
