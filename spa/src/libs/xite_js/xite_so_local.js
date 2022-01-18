X3D(function() {
    console.log("Browser ready");
    let browser = X3D.getBrowser();
    window.SOs = new Map();
    browser.addBrowserCallback({}, async function(eventType) {
        console.log(eventType);
        if(eventType === X3D.X3DConstants.INITIALIZED_EVENT) {
            
            let SOs = await fetch("SOs.json").then(resp => resp.json());
            for(sharedObject of SOs) {
                BxxEvents.dispatchEvent(new CustomEvent("SO:fromServer:existingObject", {detail: sharedObject}));
            }
        }
    });
});