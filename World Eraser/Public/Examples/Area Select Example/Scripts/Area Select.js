// -----JS CODE-----

// Area Select.js
// Lens Studio Version 4.34.0
// Event: Lens Initialized
// This script controls an area select UI element

//@ui {"widget":"group_start", "label":"Options"}
//@input float distanceThreshold = 60 {"widget":"slider", "min":0.1, "max":100.0, "step":0.01}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}

//@ui {"widget":"group_start", "label":"Advanced"}
//@input Component.Camera maskCamera
//@input Asset.Material marqueeMaterial
//@input Asset.ObjectPrefab maskPrefab
//@input Asset.Texture hintImage
//@input float hintRotation = -130.0
//@input string hintText = "Select Area To Hide"
//@ui {"widget":"group_end"}


var startPosition = new vec2(-1,-1);
var endPosition = new vec2(-1,-1);
var WMC = global.WorldMeshController;


//convert from screen coordinates to shader coordinates
function screenToShader(position) {
    //flip coordinate system y-axis
    return new vec2(position.x, 1.0 - position.y);
}

//find the minimum and maximum of two points
var getMinMax = function(pos1, pos2) {
    var minX = Math.min(pos1.x, pos2.x);
    var minY = Math.min(pos1.y,pos2.y);
    var maxX = Math.max(pos1.x, pos2.x);
    var maxY = Math.max(pos1.y,pos2.y);
    return new vec4(minX, minY, maxX, maxY);
};

//spawn a mask at the selected position
var spawnMask = function() {
    var bounds = getMinMax(startPosition, endPosition);    
    var camPos = script.maskCamera.getSceneObject().getTransform().getWorldPosition();

    var numMasks = 0;
    var padding =  1;  
    var interval = 12 - padding * 2;
    var baseScale = 2;
    
    var midx = bounds.x + (bounds.z - bounds.x) * 0.5;
    var midy = bounds.y + (bounds.w - bounds.y) * 0.5;
    var midHit = WMC.hitTest(new vec2(midx, midy));    
    if (!midHit) {
        return print("Warning: No world mesh detected");
    }
 
    //Do a grid of hit tests against the world mesh
    for (var i=padding; i<interval; i++) {
        for (var j=padding; j<interval; j++) {
          
            var x = bounds.x + ((bounds.z - bounds.x) * i / interval);
            var y = bounds.y + ((bounds.w - bounds.y) * j / interval);
            var hitPos = WMC.hitTest(new vec2(x, y));
            
            if (hitPos) {
                var dist = hitPos.distance(midHit);
                
                //see if the hit is within a certain distance of the middle of the object
                if (dist < script.distanceThreshold) {
                    
                    //if it is, add a mask cube at that location
                    var position = hitPos;
                    var cameraDirection = new vec3(camPos.x, position.y, camPos.z).sub(position);
                    var rotation = quat.lookAt(cameraDirection, vec3.up());
                    
                    var xScale = baseScale * (bounds.z - bounds.x);
                    var yScale = baseScale * (bounds.w - bounds.y);
                    var scale = new vec3(xScale, yScale, baseScale);
                    WMC.addMask(script.maskPrefab, position, scale, rotation);
                    numMasks += 1;
                } 
            }
        }
    }
   
    WMC.recordMasksCreated(numMasks);
};

var setBounds = function() {
    var startPosShader = screenToShader(startPosition);
    var endPosShader = screenToShader(endPosition);
    
    //pass the min/max points of the marquee to the shader
    script.marqueeMaterial.mainPass.bounds = getMinMax(startPosShader, endPosShader);
    
};

script.createEvent("TouchStartEvent").bind(function(event) {    
    startPosition = event.getTouchPosition();    
});

script.createEvent("TouchMoveEvent").bind(function(event) {
  
    endPosition = event.getTouchPosition();
    setBounds();
    WMC.hideHint();
});

script.createEvent("TouchEndEvent").bind(function(event) {
    var point = event.getTouchPosition();    
    endPosition = point;
    

    var selectionDistance = startPosition.distance(endPosition);
    if (selectionDistance > 0.1) {
        spawnMask();
    }
    
    //stop drawing the marquee
    startPosition = new vec2(-1,-1);
    endPosition = new vec2(-1,-1);
    setBounds();
});


script.createEvent("OnStartEvent").bind(function() {    
    setBounds();
});

