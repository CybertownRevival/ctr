(function () {
    // Navigation speed multiplier
    X3D.require(["x_ite/Components/Navigation/X3DViewpointNode"], function (ViewpointNode) {
        ViewpointNode.prototype.getSpeedFactor = function () {
            return 10;
        }
    })
})();
