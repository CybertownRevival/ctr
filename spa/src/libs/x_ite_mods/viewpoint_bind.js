(function () {
    // Viewpoint.bind to Viewpoint.set_bind as used in some scripts
    X3D.require(["x_ite/Components/Navigation/Viewpoint", "x_ite/Fields/SFBool"], function (Viewpoint, SFBool) {
        var originalInitialize = Viewpoint.prototype.initialize
        var x = new X3D.X3DFieldDefinition(X3D.X3DConstants.inputOnly, "bind", new SFBool())
        Viewpoint.prototype.fieldDefinitions.add(x)
        Viewpoint.prototype.initialize = function () {
            this.bind_.addFieldInterest(this.set_bind_)
            originalInitialize.call(this)
        }
    });
})();
