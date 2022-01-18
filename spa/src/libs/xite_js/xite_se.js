// Reflect shared events for demonstration purposes
// SE:toServer triggered when VRML wants to send events to the server
// SE:fromServer should be triggered on incoming events

/*eslint no-undef: 0*/
/*eslint no-unused-vars: 0*/



(function() {
    const TYPES = {
        "bool": {
            toJSON: e => e,
            fromJSON: e => e
        },
        "color": {
            toJSON: color => ({r: color.r, g: color.g, b: color.b}),
            fromJSON: color => new X3D.SFColor(color.r, color.g, color.b)
        },
        "float": {
            toJSON: e => e,
            fromJSON: e => e
        },
        "int32": {
            toJSON: e => e,
            fromJSON: e => e
        },
        "rotation": {
            toJSON: rotation => ({x: rotation.x, y: rotation.y, z: rotation.z, angle: rotation.angle}),
            fromJSON: rotation => new X3D.SFRotation(rotation.x, rotation.y, rotation.z, rotation.angle)
        },
        "string": {
            toJSON: e => e,
            fromJSON: e => e
        },
        "time": {
            toJSON: e => e,
            fromJSON: e => e
        },
        "vec2f": {
            toJSON: vec2f => ({x: vec2f.x, y: vec2f.y}),
            fromJSON: vec2f => new X3D.SFVec2f(vec2f.x, vec2f.y)
        },
        "vec3f": {
            toJSON: vec3f => ({x: vec3f.x, y: vec3f.y, z: vec3f.z}),
            fromJSON: vec3f => new X3D.SFVec2f(vec3f.x, vec3f.y, vec3f.z)
        }
    };
    
    BxxEvents.addEventListener("INIT", function() {
        X3D.getBrowser().addBrowserCallback({}, function(eventType) {
            if(eventType === X3D.X3DConstants.INITIALIZED_EVENT) {
                let sharedZone;
                try {
                    sharedZone = X3D.getBrowser().currentScene.getNamedNode("SharedZone");
                } catch(e) {
                    console.log("No SharedZone detected!");
                    return;
                }
                
                let eventNodeMap = new Map();
                
                for(let i = 0; i < sharedZone.events.length; i++) {
                    let eventNode = sharedZone.events[i];
                    for(let typeName of Object.keys(TYPES)) {
                        eventNode.addFieldCallback(typeName + "ToServer", {}, function(val) { // TODO: confirm validity of adding to possibly non-existent field
                            let eventObj = {name: eventNode.name, type: typeName, value: TYPES[typeName].toJSON(val)};
                            BxxEvents.dispatchEvent(new CustomEvent("SE:toServer", {detail: eventObj}));
                        });
                    }
                    
                    if(!eventNodeMap.has(eventNode.name)) {
                        eventNodeMap.set(eventNode.name, []);
                    }
                    eventNodeMap.get(eventNode.name).push(eventNode);
                    
                }
                
                BxxEvents.addEventListener("SE:fromServer", function(e) {
                    let eventObj = e.detail;
                    for(let node of eventNodeMap.get(eventObj.name)) {
                        node[eventObj.type + "FromServer"] = TYPES[eventObj.type].fromJSON(eventObj.value);
                    }
                });
            }
        });
    });
})();
