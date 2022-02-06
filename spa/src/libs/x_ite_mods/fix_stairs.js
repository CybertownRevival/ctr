(function () {
    // Fix Stairs
    X3D.require(["x_ite/Rendering/X3DRenderObject",
        "standard/Math/Numbers/Matrix4",
        "standard/Math/Numbers/Vector3",
        "standard/Math/Numbers/Rotation4",
        "standard/Math/Geometry/Camera"],
        function (RenderObject, Matrix4, Vector3, Rotation4, Camera) {
            RenderObject.prototype.initialize = function () {
                f = this.gravite.toString();
                f = 'this.gravite = ' + f.replace('{', '{\r\nvar\r\n' +
                    'projectionMatrix            = new Matrix4 (),\r\n' +
                    'cameraSpaceProjectionMatrix = new Matrix4 (),\r\n' +
                    'translation                 = new Vector3 (0, 0, 0),\r\n' +
                    'rotation                    = new Rotation4 (0, 0, 1, 0);');
                f = f.replace(
                    'this .constrainTranslation (up .multVecRot (translation .set (0, distance, 0)), false);',
                    'up .multVecRot (translation .set (0, distance, 0))');
                eval(f);
            }
        });
})();
