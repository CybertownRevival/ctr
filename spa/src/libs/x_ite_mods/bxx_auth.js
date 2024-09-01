(function () {

    // Below are additions from the Blaxxun Authoring guide and were not available on the X_ITE browser
    const Browser = X3D.require("x_ite/Browser/X3DBrowser");
    let b = Browser.prototype;

    // Time
    //var wst = X3D.getBrowser().getCurrentTime();
    b.getWorldStartTime = function () { return wst }
    b.getTime = b.getCurrentTime;
    //Browser.prototype.getTime = function () { console.log('called gettime!'); return X3D.getBrowser.getCurrentTime() }

    // Avatar
    b.setMyAvatar = function (node) { throw Error('UnimplementedBXXMethod') }
    b.showMyAvatar = function (flag) { throw Error('UnimplementedBXXMethod') }
    b.getThirdPersonView = function () { throw Error('UnimplementedBXXMethod') }

    // Sound
    b.setSoundEnabled = function (flag) { this.mute_ = flag }
    b.getSoundEnabled = function () { return this.mute_ }

    // Navigation
    b.setNavigationMode = function (mode) {
        if (this.viewer_ != mode) { // Added due to Jail calling this constantly
            this.viewer_ = mode
        }
    }
    b.getNavigationMode = function () { return this.getActiveNavigationInfo().type }
    b.setCollisionDetection = function (flag) { throw Error('UnimplementedBXXMethod'); }
    b.getCollisionDetection = function () { throw Error('UnimplementedBXXMethod'); }
    b.setGravity = function (flag) { (flag) ? this.getBrowserOptions()._Gravity = 15 : this.getBrowserOptions()._Gravity = 0 }
    b.getGravity = function () { return (this.getBrowserOptions()._Gravity == 0) ? false : true }
    //b.setHeadlight = function(flag) { this.getActiveNavigationInfo().headlight = flag }
    //b.getHeadlight = function() { return this.getActiveNavigationInfo().headlight }
    b.setViewpointAnimation = function (flag) { throw Error('UnimplementedBXXMethod') }
    b.getViewpointAnimation = function () { throw Error('UnimplementedBXXMethod') }
    b.setAvatarHeight = function (height) { this.getActiveNavigationInfo()._avatarSize[1] = height }
    b.getAvatarHeight = function () { return this.getActiveNavigationInfo()._avatarSize[1] } // Implemented in X_ITE 10.3.0
    b.setStepOverSize = function (size) { this.getActiveNavigationInfo()._avatarSize[2] = size }
    b.getStepOverSize = function () { return this.getActiveNavigationInfo()._avatarSize[2] }
    b.setCollisionDistance = function (distance) { this.getActiveNavigationInfo()._avatarSize[0] = distance }
    b.getCollisionDistance = function () { return this.getActiveNavigationInfo()._avatarSize[0] }
    b.setVisibilityLimit = function (limit) { this.getActiveNavigationInfo()._visibilityLimit = limit }
    b.getVisibilityLimit = function () { return this.getActiveNavigationInfo()._visibilityLimit }
    // TODO: Should we multiply the walkspeed to match Blaxxun?
    b.setWalkSpeed = function (speed) { navWalk.speed = this.getActiveNavigationInfo().speed }
    b.getWalkSpeed = function () { return this.getActiveNavigationInfo().speed }
    b.setViewpointByValue = function (position, orientation, mode) { throw Error('UnimplementedBXXMethod') }
    b.getViewpointByValue = function (position, orientation, mode) { throw Error('UnimplementedBXXMethod') }

    // UserInterface
    b.mouseSelect = function (startPoint) { throw Error('UnimplementedBXXMethod') }

    // URL
    b.getWorldBaseURL = function () { throw Error('UnimplementedBXXMethod') } //C:\ComputerCare\playground\playground\htdocs\merged\places\enter\vrml\
    //b.getBaseURL = function () { throw Error('UnimplementedBXXMethod') } // C:\ComputerCare\playground\playground\htdocs\merged\places\enter\vrml\ Implemented in X_ITE. Possible overlap?
    b.loadURLrel = function (URL, params) { throw Error('UnimplementedBXXMethod') }

    // Rendering
    b.setRenderMode = function (mode) { throw Error('UnimplementedBXXMethod') }
    b.getZNear = function () { throw Error('UnimplementedBXXMethod') } // BS Contact 8.0 = 0.25
    b.getZFar = function () { return this.getActiveNavigationInfo().visibilityLimit }

    // VRML Browser window
    b.getWindowSizeX = function () { return this.getElement().width() }
    b.getWindowSizeY = function () { return this.getElement().height() }
    b.getWindowAspect = function () { return this.getElement().width() / this.getElement().height() }

    // Client System
    // Likely will simply mimic values from Contact
    b.getCap = function (what) {
        switch (what) {
            case 2: return true;// transparency?
                break;
            default:
                console.log('unknown getcap: ' + what);
                throw Error('UnimplementedBXXMethod')
        }
    } // Don't think i'll implement this one
    b.getInstallDirectory = function () { return 'C:\\Users\\owner\\AppData\\Local\\Bitmanagement Software\\BS Contact\\x64\\' }
    b.setOption = function (option, val) { throw Error('UnimplementedBXXMethod') } // To implement, See page 38
    b.getOption = function (option) { throw Error('UnimplementedBXXMethod') }
    b.setUnloadMode = function (minNotActiveInlines, percentageFactorToPurve) { throw Error('UnimplementedBXXMethod') }

    /* VRML Scene, Likely will not implement these
    b.getScript = function() { throw Error('UnimplementedBXXMethod') }
    b.setBspMode = function(order) { throw Error('UnimplementedBXXMethod') }
    b.setBspLoadingMode = function(order) { throw Error('UnimplementedBXXMethod') }
    b.computeRayHit = function(startPoint, endPoint, optionalStartingNode) { throw Error('UnimplementedBXXMethod') }
    b.computeCollision = function(sourceNode, sourceMatrix, targetScenegraph, targetMatrix) { throw Error('UnimplementedBXXMethod') }
    */


    // Gah this is ugly.... It should also be routable as a definitionfield
    Object.defineProperty(b, 'viewpointPosition', {
        get: function () { return this.getActiveViewpoint().userPosition },
        set: function (val) {
            this.getActiveViewpoint().setPosition(val);
            this.getActiveViewpoint()._positionOffset[0] = 0;
            this.getActiveViewpoint()._positionOffset[1] = 0;
            this.getActiveViewpoint()._positionOffset[2] = 0;
        }
    });
    Object.defineProperty(b, 'viewpointOrientation', {
        get: function () { return this.getActiveViewpoint().getUserOrientation },
        set: function (val) {
            this.getActiveViewpoint().setOrientation(val);
            this.getActiveViewpoint()._orientationOffset.angle = 0
        }
    });
    Object.defineProperty(b, 'boundViewpoint', {
        get: function () {
            var _this = this;
            return {
                get position() { return _this.viewpointPosition },
                //set position(val) { _this.viewpointPosition = val },
                get orientation() { return _this.viewpointOrientation },
                //set orientation(val) { _this.viewpointOrientation = val }
            };
        }
    });



    //fields
    //boundViewpoint
    //viewpoints
    //boundViewpointStack

})();