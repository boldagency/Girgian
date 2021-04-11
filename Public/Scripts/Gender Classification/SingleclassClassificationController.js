// -----JS CODE-----
// SingleclassClassificationController.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Script that makes a decision whether certain class can de considered found or lost based on the probability output of ml component
// Allows to call corresponding callbacks

// @input Component.MLComponent mlComponent 
// @input string outputName {"hint": "Output placeholder name of your Ml model asset"}
// @input int classIndex = 0 {"hint" : "This is an index of desired class in your neural network output"}
//@ui {"widget":"separator"}


// @input float threshold = 0.5  {"widget" : "slider" , "min" : "0", "max" : "1" ,"step" : "0.01", "hint": "If probability is bigger than this value - class is considered as found, if less - as lost"}
//@ui {"widget":"separator"}

//@ui {"label":"Callbacks"}
//@input Component.ScriptComponent[] scriptsWithCallbacks {"hint": "If these scripts have function script.api.onFound or script.api.onLost they will be called correspondingly"}

//@ui {"widget":"separator"}
// @input bool showDebug
// @input Component.ScriptComponent debugScoreBar {"showIf" : "showDebug"}

//@ui {"widget":"separator"}
//@input bool optional
//@input SceneObject loader {"showIf" : "optional"}

//probability parameters
var smoothCoef = 0.5;
var delta = 0.1;

var minProb = script.threshold - delta;
var maxProb = script.threshold + delta;

var prevProb = 1.0;

var State = { NONE: 0, FOUND: 1, LOST: 2 };
var state = State.NONE;

var outputData;

if (checkInputs()) {
    script.mlComponent.onLoadingFinished = wrapFunction(script.mlComponent.onLoadingFinished, onLoadingFinished);
}

function onLoadingFinished() {
    //initializing output data reference
    var output;
    try {
        output = script.mlComponent.getOutput(script.outputName);
    } catch (e) {
        debugPrint(e + ". Please specify correct output name of your model");
        return;
    }
    outputData = output.data;
    if (script.classIndex < 0 || script.classIndex >= outputData.length) {
        debugPrint("Error, class index is outside of range");
        return;
    }

    if (script.loader) {
        script.loader.enabled = false;
    }
    script.createEvent("UpdateEvent").bind(onUpdate);
}

function onUpdate() {
    
    var p = outputData[script.classIndex];
    //check if we get valid values for probability
    if (p > 1.0 || p < 0.0) {
        debugPrint("Warning, your model is producing values outside of [0, 1] range. Please make sure you have sigmoid applied");
    }

    p = prevProb + smoothCoef * (p - prevProb);
    //change state based on probability
    if (p < minProb && state != State.LOST) {
        state = State.LOST;
        invokeOnLostCallbacks();
    } else if (p > maxProb && state != State.FOUND) {
        state = State.FOUND;
        invokeOnFoundCallbacks();
    }

    prevProb = p;

    if (script.showDebug && script.debugScoreBar && script.debugScoreBar.api.updateValue) {
        script.debugScoreBar.api.updateValue(p);
    }
}

function invokeOnFoundCallbacks() {
    for (var i = 0; i < script.scriptsWithCallbacks.length; i++) {
        if (script.scriptsWithCallbacks[i] && script.scriptsWithCallbacks[i].api.onFound) {
            script.scriptsWithCallbacks[i].api.onFound();
        }
    }
}

function invokeOnLostCallbacks() {
    for (var i = 0; i < script.scriptsWithCallbacks.length; i++) {
        if (script.scriptsWithCallbacks[i] && script.scriptsWithCallbacks[i].api.onLost) {
            script.scriptsWithCallbacks[i].api.onLost();
        }
    }
}

function checkInputs() {

    if (!script.mlComponent) {
        debugPrint("Error, ML Component is not set");
        return false;
    }

    if (script.showDebug) {
        if (!script.debugScoreBar) {
            debugPrint("debugScoreBar is not set");
            return false;
        }
    } else if (script.debugScoreBar) {
        script.debugScoreBar.getSceneObject().enabled = false;
    }
    return true;

}

//helper scripts

function debugPrint(text) {
    print("SingleclassClassificationHelper: " + text);
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
