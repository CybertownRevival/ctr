(function() {
    // Add SFxxx types to the Window Object, a hacky way of allowing var x = SFString("asdf") in scripts
    X3D.require(["x_ite/Fields/SFBool", "x_ite/Fields/SFString", "x_ite/Fields/SFInt32"], function(SFBool, SFString, SFInt32){
        window.SFBool = SFBool;
        window.SFString = SFString;
        window.SFInt32 = SFInt32;
    });
})();
