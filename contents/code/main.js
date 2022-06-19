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
// special applications to ignore
///////////////////////

const ignoredApps = ["plasmashell", "org.kde.plasmashell", // desktop shell
                     "krunner", "org.kde.krunner", // KRunner
                     "kwin_wayland", // lock screen
                     "org.kde.ksmserver-logout-greeter", // logout screen
                     "ksplashqml" // login splash screen
                    ];


///////////////////////
// get application a window belongs to
///////////////////////

// "dolphin"
function getApp(current) {
    if (!current) return "";
    return String(current.resourceClass);
}


///////////////////////
// keep track of active application (to check whether app has been switched)
///////////////////////

// "dolphin"
var prevApp = workspace.activeClient ? getApp(workspace.activeClient) : "";


///////////////////////
// keep track of windows belonging to same application in order of activation
///////////////////////

// {"dolphin": [oldest window, ..., most recent window], "konsole": ...}
var appGroups = {};

// compute app groups for initially present windows
workspace.clientList().forEach(window => updateAppGroups(window));

// update app groups with given window
function updateAppGroups(current) {
    if (!current) return;
    let app = getApp(current);
    let appGroup = (appGroups[app] ? appGroups[app] : [])
        .filter(window => window && window != current).concat(current);
    debug("updating app group", appGroup.map(window => window.caption));
    appGroup[app] = appGroup;
}

// return other visible windows of same application as given window
function getAppGroup(current) {
    if (!current) return;
    let appGroup = appGroups[getApp(current)].filter(window => window && 
        !window.minimized && 
        (window.desktop == current.desktop ||
         window.onAllDesktops || current.onAllDesktops));
    debug("getting app group", appGroup.map(window => window.caption));
    return appGroup;
}


///////////////////////
// main
///////////////////////

// when client is activated, auto-raise other windows of the same applicaiton
workspace.clientActivated.connect(active => {
    if (!active) return;
    let app = getApp(active);
    debug("---------");
    debug("activated", active.caption);
    debug("app", getApp(active));
    // abort if application is ignored
    if (ignoredApps.includes(app)) {
        debug("ignored");
        return;
    }
    updateAppGroups(active);

    // if application was switched
    debug("previous app", prevApp);
    if (app != prevApp) {
        debug("app switched");
        prevApp = app;
        // auto-raise other windows of same application
        for (let window of getAppGroup(active)) {
            debug("auto-raising", window.caption);
            workspace.activeClient = window;
        }
    }
});
