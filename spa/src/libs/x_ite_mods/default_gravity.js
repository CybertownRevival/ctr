(function () {
    // Set default gravity
    X3D.require(["x_ite/Browser/Core/BrowserOptions"], function (BrowserOptions) {
        BrowserOptions.prototype.fieldDefinitions.filter(e => {
            return e.name == 'Gravity'
        })[0].value.set(40)
    });
})();
