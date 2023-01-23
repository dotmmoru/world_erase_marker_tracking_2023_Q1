// -----JS CODE-----

// World Mesh Controller.js
// Lens Studio Version 4.34.0
// Event: Lens Initialized
// Controller for applying inpainting effect from image space interaction
// free drawing or with a area select

//@input Component.Camera maskCamera

//@input SceneObject examples
//@input bool advanced
//@input Component.Text hintText {"showIf": "advanced"}
//@input SceneObject undoButton {"showIf": "advanced"}
//@input SceneObject animatedHintBox {"showIf": "advanced"}
//@input Component.Image hintImage {"showIf": "advanced"}

function WorldMeshController() {
    this.worldMeshAdded = false;    
    this.masks = [];
    this.numMasksCreated = [];
    this.maxMasks = 1000;
}

WorldMeshController.prototype.trackingStarted = function() {
    if (!this.worldMeshAdded) {
        this.worldMeshAdded = true;
        for (var i=0; i<script.examples.getChildrenCount(); i++) {
            var obj = script.examples.getChild(i);
            var scr = obj.getComponent("Component.ScriptComponent");
            
            if (obj.enabled) {
                this.setHint(scr.hintImage, scr.hintRotation, scr.hintText);
            }            
        }
        print("trackingStarted");        
    }
};

WorldMeshController.prototype.setHint = function(imageTexture, imageRotation, text) {   
    var rotation = imageRotation ? imageRotation : 0;
    var q = quat.fromEulerAngles(0,0,rotation*Math.PI/180);
    script.hintImage.mainMaterial.mainPass.baseTex = imageTexture;
    script.hintImage.getSceneObject().getComponent("Component.ScreenTransform").rotation = q;
    script.hintText.text = text;
    script.hintImage.enabled = true;
    script.hintText.enabled = true;
    if (text.includes("Select")) {
        script.animatedHintBox.enabled = true;
    }
};

WorldMeshController.prototype.hideHint = function() {
    script.hintImage.enabled = false;
    script.hintText.enabled = false;
    script.animatedHintBox.enabled = false;
};


//find the world mesh position of a screen position
WorldMeshController.prototype.hitTest = function(screenPosition) {
    var deviceTracking = script.maskCamera.getSceneObject().getComponent("Component.DeviceTracking");
    var results = deviceTracking.hitTestWorldMesh(screenPosition);
    if (results.length > 0) {    
        var point = results[0].position;
        return point;
    }
    return null;
};

WorldMeshController.prototype.recordMasksCreated = function(numMasks) 
{
    print("recordMasksCreated");
    this.numMasksCreated.push(numMasks);
};

//instantiate a prefab, add it to an array, and set its transform
WorldMeshController.prototype.addMask = function(prefab, position, scale, rotation) {
    script.undoButton.enabled = true;
    if (this.masks.length >= this.maxMasks) {
        var discardMask = this.masks.shift();
        discardMask.destroy();
    }
    
    var parent = script.maskCamera.getSceneObject().getParent();
    var maskObj = prefab.instantiate(parent);
    if (position) {
        maskObj.getTransform().setWorldPosition(position);
    }
    if (scale) {
        maskObj.getTransform().setWorldScale(scale);
    }
    if (rotation) {
        maskObj.getTransform().setWorldRotation(rotation);
    }
    maskObj.enabled = true;    
    
    this.masks.push(maskObj);    
    return maskObj;
};

WorldMeshController.prototype.destroy = function() {        
    for (var i=0; i < this.masks.length; i++) {
        this.masks[i].destroy();
        this.masks = [];
        this.numMasksCreated = [];
    }
};


WorldMeshController.prototype.undo = function() {
    var numToUndo = this.numMasksCreated.pop() || 0;
    var count = 0;
    while (count < numToUndo && this.masks.length > 0) {
        var discardMask = this.masks.pop();
        discardMask.destroy();
        count += 1;
    }
    
    if (this.masks.length == 0) {
        script.undoButton.enabled = false;
        this.numMasksCreated = [];
    }  
};

function initialize() {
    if (!script.maskCamera) {
        print ("World Mesh Controller: provide an input mask camera");
    }    

    var reset = function() {
        global.WorldMeshController.reset.call(global.WorldMeshController);
    };
    
    script.createEvent("WorldTrackingMeshesAddedEvent").bind(function(event) {        
        global.WorldMeshController.trackingStarted.call(global.WorldMeshController);        
    });

    script.createEvent("CameraBackEvent").bind(reset);
    script.createEvent("CameraFrontEvent").bind(reset);
    
    global.touchSystem.touchBlocking = true;
    global.WorldMeshController = new WorldMeshController();
}

WorldMeshController.prototype.reset = function() {    
    while (this.masks.length > 0) {        
        this.undo();
    }    
};

initialize();
