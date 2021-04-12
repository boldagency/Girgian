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
//@input Component.AnimationMixer[] candies

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
var isCandyVisible=false;
var playCandyAnimation=false;
var candy=null;

function initialize() {
    if (validateInputs()) {
        setInputs();
        generateParticles();
        isInitialized = true;
        
        candy= getRandomCandy();
    }
}

function onUpdate(eventData) {
    updateWorldParticles();
    

    if(script.hand.getTransform().getWorldRotation().z>= -0.2 || script.middleFinger.getTransform().getWorldRotation().z > -0.9){
       stop();
        
    //    print(script.middleFinger.getTransform().getWorldPosition().y + ' '+ script.wrist.getTransform().getWorldPosition().y );
       
        //check if hand palm is closed
       var diff= script.middleFinger.getTransform().getWorldPosition().y - script.wrist.getTransform().getWorldPosition().y;     
         if(script.middleFinger.getTransform().getWorldRotation().z > -0.7 ){
          // print('1 '+ diff )
            if(isCandyVisible && diff > 2){
                
                isCandyVisible=false;
                   if(global.tweenManager){                      
                    global.tweenManager.startTween( candy.getSceneObject(), "hide_plane");
                   
                  }    
               }
            }
          
        


    }
    else{
        if(!isTrackingLost &&   !isCandyVisible ){
                play()  
                showCandy()
        }

    }
}


//Get Random Candy to be displayed when user opens his hand
function getRandomCandy()
{
   var rand = Math.floor(Math.random() * script.candies.length);
   return script.candies[rand];
}


function showCandy(){
    if(global.tweenManager){
        isCandyVisible=true
        global.tweenManager.startTween(candy.getSceneObject(), "show_plane");
        candy.autoplay=true;

        if(!playCandyAnimation){
            playCandyAnimation=true            
             candy.autoplay=true
             candy.start('Layer0', 0, 1);
        }
    } 
}



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
    if(script.hand.getTransform().getWorldRotation().z < 0){
        
        if(!isPlayed){
            isPlayed=true; 
            script.sound.play(1) 
        }
        isParticlePlaying = true;
    }
}

function hideCandies(){
    for(var i=0; i<script.candies.length; i++){
        global.tweenManager.startTween( script.candies[i].getSceneObject(), "hide_plane");
    }
}

function stop() {
   isParticlePlaying = false;
}

function closeGesture(){
    isHandClosed=true
    isCandyVisible=false    
}
script.api.closeGesture=closeGesture;

function openGesture(){
        isHandClosed=false
}
script.api.openGesture=openGesture;


function trackingFound() {
    isTrackingLost=false;
     //hide all candies and assign new candy
    hideCandies();
    isCandyVisible=false;
   
    candy= getRandomCandy();
}

script.api.trackingFound=trackingFound;

function trackingLost() { 
    isTrackingLost=true;
    isPlayed=false; 
    stop();   
    isParticlePlaying = false;
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