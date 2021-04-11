// ClassificationBehaviorHelper.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: This is one of the singleclass classification helper scripts that allows to send custom behavior script trigger when class is found or lost
// @ui {"label" : "Send Custom Behavior Triggers:"}

// @input string[] onFoundTriggers
// @input string[] onLostTriggers

// @input Component.Head femaleHead;
// @input Component.Head maleHead;

var automaticDetection = true;


script.api.onFound = function() {
    if(automaticDetection){
        callBehaviorArray(script.onFoundTriggers); 
    }
   
};

script.api.onLost = function() {
    callBehaviorArray(script.onLostTriggers);
    automaticDetection=true;
};

function callBehaviorArray(arr) {
    if (!arr.length) {
        return;
    }
    
    for (var i = 0; i < arr.length; i++) {
        if (global.behaviorSystem) {
            global.behaviorSystem.sendCustomTrigger(arr[i]);    
        } else {
            print("ClassificationBehaviorHelper: ERROR, behaviorSystem not found. Please make sure at least one script is using Behavior.");
        }
    }
}

script.api.toggleGender = function(gender) {
    automaticDetection=false;
   // print(gender);
    if(gender=='MALE'){ 
        script.femaleHead.getSceneObject().enabled=false;
        script.maleHead.getSceneObject().enabled=true;
    }
    else{
        script.maleHead.getSceneObject().enabled=false;
        script.femaleHead.getSceneObject().enabled=true;
    }   
}

