// -----JS CODE-----
// WorldParticleController.js
// Version: 0.0.2
// Event: Initialized
// Description: Creating duplicates from particles to create world particles looks effect

// @input SceneObject particle
// @input bool playOnTurnOn
// @input float animationLength = 5
// @input int maxParticleSystems = 50 {"widget":"slider", "min":1, "max":50, "step":1}
// @input float spawnInterval = 0.01
// @input float spawnInterval = 0.01
//@input Component.Image hand
//@input Component.Image wrist
//@input Component.Image middleFinger
//@input Component.ScriptComponent airplane
//@input Component.AnimationMixer airplaneObject
//@input Component.AudioComponent sound

// Initialize variables to store the particle systems in
var instances = []; // Each particle system
var startTimes = []; // When that particle system started
var mainMaterialPasses = []; // The particle system's material

// Keep track of our particle systems
var lastSpawnTime = 0; // When we last started a particle system
var nextSpawnIdx = 0; // Index of the particle system we should modify next
var onUpdatingIndex = 0;
var currentTime = 0;

var isInitialized = false;
var isParticlePlaying = true;
var isPaused = true;
var updateParticles = true;
var passContainer = [];
var isTrackingLost = true;
var isHandClosed = false;

var isPlayed=false;
var countDown=5;
var isCountDownOver=false;

var isCandyVisible=false;
var playCandyAnimation=false;

function initialize() {
    if (validateInputs()) {
        setInputs();
        generateParticles();
        isInitialized = true;
    }
}

function onUpdate(eventData) {
    updateWorldParticles();

    if(script.hand.getTransform().getWorldRotation().z>= -0.2 || script.middleFinger.getTransform().getWorldRotation().z > -0.8){
       stop();
      
         if(script.middleFinger.getTransform().getWorldRotation().z > -0.7){
           
            if(isCandyVisible){
                isCandyVisible=false;
                   if(global.tweenManager){  
                   //     print('hide3')
                        global.tweenManager.startTween(script.airplaneObject.getSceneObject(), "hide_plane");
                    }  
            }
          
        }


    }
    else{
        if(!isTrackingLost ){
                play()  
                if(global.tweenManager && !isCandyVisible){
                isCandyVisible=true
            global.tweenManager.startTween(script.airplaneObject.getSceneObject(), "show_plane");
                script.airplaneObject.autoplay=true;
                
                   if(!playCandyAnimation){
                    delayedEventANimation.reset(1);
                    print("delay has started");


        }
            } 
    
        }

    }
}

var delayedEventANimation = script.createEvent("DelayedCallbackEvent");
delayedEventANimation.bind(function(eventData)
{
    //print("delay is over");
     playCandyAnimation=true
     script.airplaneObject.autoplay=true
      script.airplaneObject.start('Layer0', 0, 2);

});

// Start with a 2 second delay

function generateParticles() {
    var originalParticleMeshVisual = script.particle.getComponent("Component.RenderMeshVisual");
    originalParticleMeshVisual.enabled = true;
    
    var handPosition= script.hand.getSceneObject();

    // Generate all our particle systems
    for (var i = 0; i < script.maxParticleSystems; i++) {
        var newObject = global.scene.createSceneObject("Particle_Trails");

        // Set the layer to be the same as the original particle
        newObject.layer = script.particle.layer;
        // Set the scale to be the same as the original particle
        newObject.getTransform().setWorldScale(script.particle.getTransform().getWorldScale());

        newObject.enabled = false;

        var mv = newObject.copyComponent(originalParticleMeshVisual);
        mv.clearMaterials();
        mv.addMaterial(originalParticleMeshVisual.mainMaterial.clone());
        
        //var t= handPosition.getTransform().getWorldPosition();
        var t= script.hand.getSceneObject().getTransform().getWorldPosition();
        t.x= t.x + 120;
       // t.y=0;
       // t.z=0;
        
       
      newObject.getTransform().setWorldPosition(t) ;
        var pass = mv.mainMaterial.mainPass;
        pass.externalSeed = Math.random();

        instances.push(newObject);
        startTimes.push(0.0);
        mainMaterialPasses.push(pass);
    }
}

function updateWorldParticles() {
    if (!isInitialized) {
        return;
    }
    currentTime += getDeltaTime();

    var t = currentTime - lastSpawnTime;

    // Restart particle system's position at current pos as needed
    if (t > script.spawnInterval) {
        var currentPos = script.particle.getTransform().getWorldPosition();
        var currentRot = script.particle.getTransform().getWorldRotation();
        var index = nextSpawnIdx % script.maxParticleSystems;
        var instance = instances[index];

        lastSpawnTime = currentTime;
        startTimes[index] = currentTime;

       instance.enabled = isParticlePlaying;
        
        var hand= script.wrist.getTransform().getWorldPosition()
       currentPos.x=hand.x+120;
       currentPos.y= Math.floor(Math.random() * (hand.y-5  - hand.y+5  + 1) + (hand.y-5));;
       currentPos.z=currentPos.z  ;
        instance.getTransform().setWorldPosition(currentPos);
        instance.getTransform().setWorldRotation(currentRot);

        if (updateParticles && nextSpawnIdx < onUpdatingIndex + script.maxParticleSystems) {
            updateFromMainMaterialPass(mainMaterialPasses[index]);
        } else {
            passContainer.length = 0;
        }

       nextSpawnIdx++;
    }

    // Update all particle system's time
    for (var i = 0; i < script.maxParticleSystems; ++i) {
        var timeOffset = startTimes[i];
        var obj = instances[i];
        var pass = mainMaterialPasses[i];
        var shaderTime = currentTime - timeOffset;

        if (shaderTime > script.animationLength) {
            obj.enabled = false;
        } else {
            pass.externalTimeInput = shaderTime;
        }
    }
}

function updateFromMainMaterialPass(currentPass) {
    for (var i = 0; i < passContainer.length; ++i) {
        currentPass[passContainer[i].passName] = passContainer[i].passValue;
    }
}

// Checking each inputs and make sure they are sets
function validateInputs() {
    if (!script.particle) {
        print("WorldParticleController, ERROR: Please make sure to assign a particle to the script.");
        return false;
    }
    if (!script.particle.getComponent("Component.RenderMeshVisual")) {
        print("WorldParticleController, ERROR: Please make sure the particle object has Renderer Mesh Visual on it.");
        return false;
    }

    return true;
}

function setInputs() {
    script.particle.enabled = false;
    isParticlePlaying = script.playOnTurnOn;

    script.api.play = play;
    script.api.stop = stop;
    script.api.updateParticlePasses = updateParticlePasses;
}
function play() {
    if(script.hand.getTransform().getWorldRotation().z < -0.2 && script.middleFinger.getTransform().getWorldRotation().z <= -0.8){
        
        if(!isPlayed){
            isPlayed=true; 
            script.sound.play(1)
          
        }
    isParticlePlaying = true;
        if(!isTrackingLost ){
          countdownStart()
        }
    }
}

function stop() {
   isParticlePlaying = false;
 //   isPlayed=false;
}
function closeGesture(){
        isHandClosed=true
    isCandyVisible=false
        
}
var countDownDate=10;
//Enable Counter
function countdownStart() {
    // Update the count down every 1 second
    var delayedEvent = script.createEvent('DelayedCallbackEvent')
    delayedEvent.bind(function(eventData) {
    countDownDate  = countDownDate - 1;
         if (countDownDate <= 5) {
            stop();
           // print('show candy')
        }
      if (countDownDate <= 0) {
        countdownFinished()
      } else {
        delayedEvent.reset(1)
      }
    })
    delayedEvent.reset(0)
}

//Function that will run when countdowun is over
function countdownFinished() {
    if(!isTrackingLost ){
    stop();
    countDownDate=10;
    }
}

script.api.closeGesture=closeGesture;

function openGesture(){
        isHandClosed=false
}
script.api.openGesture=openGesture;


function trackingFound() {
    isTrackingLost=false;

   // isParticlePlaying = false;
}
script.api.trackingFound=trackingFound;
function trackingLost() {

    
     isTrackingLost=true;
    isPlayed=false; 
    playCandyAnimation=false;
    stop();
    stop();
    
    
   if(global.tweenManager){  
       global.tweenManager.startTween(script.airplaneObject.getSceneObject(), "hide_plane");
  }  
   

   // isParticlePlaying = false;
}
script.api.trackingLost=trackingLost;

function updateParticlePasses(updatePassName, updatePassValue, open) {   
    if(updatePassName=='v')
    onUpdatingIndex = nextSpawnIdx;
    passContainer.push({
        passName: updatePassName,
        passValue: updatePassValue
    });     

}

initialize();

var event = script.createEvent("UpdateEvent");
event.bind(onUpdate);