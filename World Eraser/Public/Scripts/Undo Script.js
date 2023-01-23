// -----JS CODE-----

// Undo Script.js
// Lens Studio Version 4.34.0
// Event: Lens Initialized
// Catches undo events for restoring previous state

var WMC = global.WorldMeshController;

script.createEvent("TapEvent").bind(function() {
    WMC.undo.call(WMC);
});