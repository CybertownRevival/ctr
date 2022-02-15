(function () {
    // Blaxxun Speed & Avatar Size Defaults
    X3D.require(["x_ite/Components/Navigation/NavigationInfo"], function (NavigationInfo) {
        var nav = NavigationInfo.prototype.fieldDefinitions.index;
        //nav['speed'].value.set(1);
        //nav['visibilityLimit'].value.set(450);
        //nav['headlight'].value.set(false);
        //nav['avatarSize'].value.set([0.25, 1.75, 0.75, 0]);
        nav['type'].value.set(["WALK", "FLY"]); // Only allowing the Walk and Fly viewers
    });

})();
