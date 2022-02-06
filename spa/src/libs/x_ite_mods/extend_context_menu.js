(function () {
    // Extend Context Menu
    X3D.require(["x_ite/Browser/Core/ContextMenu"], function (ContextMenu) {
        let originalBuild = ContextMenu.prototype.build;
        ContextMenu.prototype.build = function (trigger, event) {
            var menu = originalBuild.call(this, trigger, event);
            console.log(menu.items);
            menu.items['testitem1'] = {
                name: "Test Item",
                callback: function () {
                    alert("You clicked it!");
                }
            }
            return menu;
        }
    });
})();
