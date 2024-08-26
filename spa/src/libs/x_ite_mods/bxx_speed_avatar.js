(function () {
    // Blaxxun Speed & Avatar Size Defaults
    const NavigationInfo = X3D.require("x_ite/Components/Navigation/NavigationInfo");
    var nav = NavigationInfo.fieldDefinitions;
    //nav.get('speed').value.set(1);
    //nav.get('visibilityLimit').value.set(450);
    //nav.get('headlight').value.set(false);
    //nav.get('avatarSize').value.set([0.25, 1.75, 0.75, 0]);
    nav.get('type').value.set(["WALK", "FLY"]); // Only allowing the Walk and Fly viewers

})();