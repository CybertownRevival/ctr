(function () {

    
    const Appearance = X3D.require("x_ite/Components/Shape/Appearance");
    let originalTraverse = Appearance.prototype.traverse;
    Appearance.prototype.traverse = function (type, renderObject) {
        if (this.materialNode) {
            this.materialNode.white = !!(this.textureNode && this.textureNode.knownRgb);
        }
        return originalTraverse.call(this, type, renderObject);
    }
    
    const Material = X3D.require("x_ite/Components/Shape/Material");
    let originalSetShaderUniforms = Material.prototype.setShaderUniforms;
    Material.prototype.setShaderUniforms = function (gl, shaderObject) {
        originalSetShaderUniforms.call(this, gl, shaderObject);
        if(this.white) {
            gl.uniform3fv(shaderObject.x3d_DiffuseColor, [1, 1, 1]);
        }
    }
    
    const X3DTexture2DNode = X3D.require("x_ite/Components/Texturing/X3DTexture2DNode");
    let originalSetTexture = X3DTexture2DNode.prototype.setTexture;
    X3DTexture2DNode.prototype.setTexture = function (width, height, transparent, data, flipY) {
        this.knownRgb = false;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) {
                this.knownRgb = true;
                break;
            }
        }
        return originalSetTexture.call(this, width, height, transparent, data, flipY);
    };

})();