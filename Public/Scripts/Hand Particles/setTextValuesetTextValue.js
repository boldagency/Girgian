// -----JS CODE-----
// AttachToObjectTracking.js
// Version: 0.0.2
// Event: Initialized
// Description: Attach a 3D object to an Object Tracking object with a tunable depth

// @input int onTrackingLost = 1 {"widget":"combobox", "values":[{"label":"Hide All Objects", "value":1}, {"label":"Keep Showing All Objects", "value":2}]}
// @input bool applyRotation = true
// @input bool customTrigger {"label":"Behavior Trigger"}
// @ui {"widget":"group_start", "label":"Triggers", "showIf":"customTrigger"}
// @input string trackingFound = "tracking_found"
// @input string trackingLost = "tracking_lost"
// @ui {"widget":"group_end"}
// @ui {"widget":"group_start", "label":"Advanced"}
// @input Component.Camera perspectiveCamera
// @input Component.ObjectTracking objectTracking
// @input float desiredModelHeight = 10 {"label":"Object Height"}
// @ui {"widget":"group_end"}

var screenTransform;
var isInitialized = false;
var childMeshVisuals = [];
var meshCount = 0;

// This function runs when lens starts
function initialize() {
    // Make sure all inputs are set
    if (validateInputs()) {
        // Get screen transform of the object tracking
        screenTransform = script.objectTracking.getSceneObject().getComponent("ScreenTransform");
        getAllChildMeshVisuals(script.getSceneObject());
        toggleChildMeshVisuals(false);
        script.objectTracking.onObjectFound = wrapFunction(script.objectTracking.onObjectFound, onObjectFound);
        script.objectTracking.onObjectLost = wrapFunction(script.objectTracking.onObjectLost, onObjectLost);
        isInitialized = true;
    }
}

function onUpdate() {
    if (isInitialized) {
        // Enable the object when tracking
        var anchors = screenTransform.anchors;
        var center = anchors.getCenter();
        var rotation = screenTransform.rotation;
        var anchorHeight = anchors.getSize().y / 2;
        var modelSize = script.desiredModelHeight;
        // Get the tracked object's position in camera screen space
        var screenPos = screenTransform.localPointToScreenPoint(center);
        var fov = script.perspectiveCamera.fov;
        var depth = (modelSize / anchorHeight) * .5 / Math.tan(fov * 0.5);
        // Get the world position in the camera's view using our screen pos and estimated depth
        var worldPos = script.perspectiveCamera.screenSpaceToWorldSpace(screenPos, depth);
        // Apply world position
        script.getTransform().setWorldPosition(worldPos);
        if (script.applyRotation) {
            // Apply rotation (should only be rotated on z axis)
            script.getTransform().setWorldRotation(rotation);
        }
    }
}

// This gets called when tracking is found
function onObjectFound() {
    toggleChildMeshVisuals(true);
    sendCustomTrigger(script.trackingFound);
}

// This gets called when tracking is lost
function onObjectLost() {
    if (script.onTrackingLost == 1) {
        toggleChildMeshVisuals(false);
    }
    sendCustomTrigger(script.trackingLost);
}

// Enable or disable all the objects with mesh renderer component
function toggleChildMeshVisuals(isEnabled) {
    for (var i = 0; i < childMeshVisuals.length; i++) {
        for (var j = 0; j < childMeshVisuals[i].length; j++) {
            childMeshVisuals[i][j].enabled = isEnabled;
        }
    }
}

function sendCustomTrigger(triggerName) {
    if (script.customTrigger) {
        global.behaviorSystem.sendCustomTrigger(triggerName);
    }
}

// Checking each inputs and make sure they are sets
function validateInputs() {
    if (!script.perspectiveCamera) {
        print("AttachToObjectTracking, ERROR: Please make sure main Camera (Perspective Camera) object exist and assign the Camera object to the script.");
        return false;
    }
    if (!script.objectTracking) {
        print("AttachToObjectTracking, ERROR: Please make sure main Object Tracking object exist and assign the Tracker object to the script.");
        return false;
    }
    return true;
}

// Getting all Base Mesh Visual Component on each and every children
function getAllChildMeshVisuals(object) {
    var childCount = object.getChildrenCount();
    for (var i = 0; i < childCount; i++) {
        var childObject = object.getChild(i);
        if (childObject.getComponent("Component.BaseMeshVisual")) {
            childMeshVisuals[meshCount] = childObject.getComponents("Component.BaseMeshVisual");
            meshCount++;
        }
        getAllChildMeshVisuals(childObject);
    }
}

function wrapFunction(origFunc, newFunc) {
    if (!origFunc) {
        return newFunc;
    }
    return function() {
        origFunc();
        newFunc();
    };
}

initialize();

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(onUpdate);