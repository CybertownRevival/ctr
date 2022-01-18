(function() {
    
    X3D.require(["x_ite/Components/Shape/Appearance", "x_ite/Components/Shape/Material", "x_ite/Components/Texturing/X3DTexture2DNode"], function(Appearance, Material, X3DTexture2DNode) {
    
        let originalTraverse = Appearance.prototype.traverse;
        Appearance.prototype.traverse = function(type, renderObject) {
            if(this.materialNode) {
                this.materialNode.white = !!(this.textureNode && this.textureNode.knownRgb);
            }
            return originalTraverse.call(this, type, renderObject);
        }
        
        Material.prototype.setShaderUniforms = function(gl, shaderObject) {
            gl .uniform1i  (shaderObject .x3d_SeparateBackColor, false);
            gl .uniform1f  (shaderObject .x3d_AmbientIntensity,  this .ambientIntensity);
            gl .uniform3fv (shaderObject .x3d_DiffuseColor,      (this.white ? [1, 1, 1] : this .diffuseColor));
            gl .uniform3fv (shaderObject .x3d_SpecularColor,     this .specularColor);
            gl .uniform3fv (shaderObject .x3d_EmissiveColor,     this .emissiveColor);
            gl .uniform1f  (shaderObject .x3d_Shininess,         this .shininess);
            gl .uniform1f  (shaderObject .x3d_Transparency,      this .transparency);
        }
        
        let originalSetTexture = X3DTexture2DNode.prototype.setTexture;
        X3DTexture2DNode.prototype.setTexture = function(width, height, transparent, data, flipY) {
            this.knownRgb = false;
            for(let i = 0; i < data.length; i += 4) {
                if(data[i] !== data[i+1] || data[i+1] !== data[i+2]) {
                    this.knownRgb = true;
                    break;
                }
            }
            
            return originalSetTexture.call(this, width, height, transparent, data, flipY);
        };
    });
})();
