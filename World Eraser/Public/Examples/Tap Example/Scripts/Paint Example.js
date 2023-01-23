// Paint Example.js
// Lens Studio Version 4.34.0
// Event: Lens Initialized
// A simple screen drawing interface with an undo option
// @input Component.Camera Camera
//@ui {"widget":"group_start", "label":"Options"}
//@input float brushSize = 3.0 {"widget":"slider", "min":1.0, "max":15.0, "step":0.01}
//@ui {"widget":"group_end"}
//@ui {"widget":"separator"}
//@ui {"widget":"group_start", "label":"Advanced"}
//@input Asset.Texture hintImage
//@input string hintText = "Tap Area To Hide"
//@input Asset.ObjectPrefab maskPrefab 
//@input Component.ScreenTransform undoTransform
//@ui {"widget":"group_end"}
//@input SceneObject erraseMarkerPointParent


var erraseMarkerPoint = [];
var WMC = global.WorldMeshController;
var numMasks = 0;

var isSpawned = false;

var arraErrase = [];

script.createEvent("TapEvent").bind(function(event) {
   // handleTap(event.getTapPosition());
    
});

script.createEvent("TouchMoveEvent").bind(function(event) {
   // handleTap(event.getTouchPosition());
});

script.createEvent("TouchEndEvent").bind(function(event) {
    /*  
    if (script.undoTransform.containsScreenPoint(event.getTouchPosition())) {
        return;
    }
    
    WMC.recordMasksCreated(numMasks);
    numMasks = 0;
    */
});

function Start()
{
    for (var i = script.erraseMarkerPointParent.getChildrenCount() - 1; i >= 0; i--) {
        erraseMarkerPoint.push(script.erraseMarkerPointParent.getChild(i));
    }
}

script.api.OnMarkerFound = function()
{
    if(isSpawned === false)
    {
        if(erraseMarkerPoint.length>0)
        {
            for (var i = erraseMarkerPoint.length - 1; i >= 0; i--) {
                var pos = script.Camera.worldSpaceToScreenSpace(erraseMarkerPoint[i].getTransform().getWorldPosition());
                var test = handleTap(pos);
                if(isSpawned === false)
                    isSpawned = test;
            }

            WMC.recordMasksCreated(numMasks);
            numMasks = 0;
        }
    }else 
    {
        for (var i = arraErrase.length - 1; i >= 0; i--) {
            arraErrase[i].enabled = true;
        }  
    }
}

script.api.OnMarkerLost = function()
{
    for (var i = arraErrase.length - 1; i >= 0; i--) {
            arraErrase[i].enabled = false;
        }
}

var lastSpawnPosition = vec3.zero();

function handleTap(pos) {
    //don't spawn when tapping undo button
    if (script.undoTransform.containsScreenPoint(pos)) {
        return;
    }
    
    var position = WMC.hitTest(pos);
    var scale = vec3.one().uniformScale(script.brushSize);
    if (position != null && position.distance(lastSpawnPosition) > script.brushSize * 3) {
        WMC.hideHint();
        lastSpawnPosition = position;
        arraErrase.push(WMC.addMask(script.maskPrefab, position, scale));
        print(arraErrase.length);
        numMasks += 1;
    } 
    
    if (position == null) 
    {
        return false;
        print("Warning: scan area first");
    }
    return true;
}

Start();