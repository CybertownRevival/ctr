(function () {

    async function getImgPixels(img) {
        if(!img.complete) {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
        }
        let canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
    }

    function applyRgb(target, data) {
        target.knownRgb = false;
        let gotData = Promise.resolve(data);
        if(data instanceof HTMLImageElement) {
            gotData = getImgPixels(data);
        }
        gotData.then(data => {
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) {
                    target.knownRgb = true;
                    break;
                }
            }
        });
    }

    
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
    let originalSetTextureData = X3DTexture2DNode.prototype.setTextureData;
    X3DTexture2DNode.prototype.setTextureData = function (width, height, colorSpaceConversion, transparent, data){
        applyRgb(this, data);
        return originalSetTextureData.call(this, width, height, colorSpaceConversion, transparent, data);
    };

    let originalUpdateTextureData = X3DTexture2DNode.prototype.updateTextureData;
    X3DTexture2DNode.prototype.updateTextureData = function(data) {
        applyRgb(this, data);
        return originalUpdateTextureData.call(this, data);
    };

})();