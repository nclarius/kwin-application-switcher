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
    if (!current || typeof current.resourceClass !== 'string') return "";
    return String(current.resourceClass);
}


///////////////////////
// keep track of active application (to check whether app has been switched)
///////////////////////

// "dolphin"
var prevActiveApp = ""

// set previously active application for initially active window
setPrevActiveApp(workspace.activeClient);

// set previously active application for recently activated window
function setPrevActiveApp(current) {
    if (!current) return;
    prevActiveApp = getApp(current);
}

// get previously active application
function getPrevActiveApp() {
    return prevActiveApp;
}


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
    if (!appGroups[app]) appGroups[app] = [];
    appGroups[app] = appGroups[app].filter(window => window && 
        window != current);
    appGroups[app].push(current);
    debug("updating app group", appGroups[app].map(window =>
        window && window.caption ? window.caption : "undefined window"
    ));
}

// return other visible windows of same application as given window
function getAppGroup(current) {
    if (!current) return;

    let appGroup = appGroups[getApp(current)].filter(window =>
        window &&
        !window.minimized &&
        (
            (window.x11DesktopIds && window.x11DesktopIds.includes(workspace.currentDesktop)) ||
            (window.x11DesktopIds && window.x11DesktopIds.length === 0)
        ) &&
        (
            (window.activities && window.activities.includes(workspace.currentActivity)) ||
            (window.activities && window.activities.length === 0)
        )
    );

    debug("getting app group", appGroup.map(window =>
        window && window.caption ? window.caption : "undefined window"
    ));
    return appGroup;
}


///////////////////////
// main
///////////////////////

// when client is activated, auto-raise other windows of the same applicaiton
workspace.clientActivated.connect(active => {
    if (!active) return;
    debug("---------");
    debug("activated", active.caption);
    debug("app", getApp(active));
    // abort if application is ignored
    if (ignoredApps.includes(getApp(active))) {
        debug("ignored");
        return;
    }
    updateAppGroups(active);

    // if application was switched
    debug("previous app", getPrevActiveApp());
    if (getApp(active) != getPrevActiveApp()) {
        debug("app switched");
        setPrevActiveApp(active);
        // auto-raise other windows of same application
        for (let window of getAppGroup(active)) {
            if (window) {
                debug("auto-raising", window.caption);
                workspace.activeClient = window;
            }
        }
    }
});
