(function () {

  X3D.require(["x_ite/Browser/Navigation/WalkViewer"], function (WalkViewer) {
    let originalInitialize = WalkViewer.prototype.initialize;

    WalkViewer.prototype.keydown = function (e) {
      if (e.keyCode > 36 && e.keyCode < 41 || e.keyCode == 17) {
        if (this.keyx == 0 && this.keyy == 0) {
          this.fromVector.set(0, 0, 0);
          this.toVector.assign(this.fromVector);
          this.getFlyDirection(this.fromVector, this.toVector, this.direction);
          this.getBrowser().setCursor("MOVE");
          this.addFly();
        }
        if (e.keyCode == 37) this.keyx = -50;  // Left
        if (e.keyCode == 38) this.keyy = -100; // Up
        if (e.keyCode == 39) this.keyx = 50;   // Right
        if (e.keyCode == 40) this.keyy = 100;  // Down
        if (this.getBrowser().getControlKey())
          this.toVector.set(this.keyx, this.keyy / 4, 0);
        else
          this.toVector.set(this.keyx, 0, this.keyy);
        this.getFlyDirection(this.fromVector, this.toVector, this.direction);
      }
    }

    WalkViewer.prototype.keyup = function (e) {
      if (e.keyCode == 37 || e.keyCode == 39) this.keyx = 0;
      if (e.keyCode == 38 || e.keyCode == 40) this.keyy = 0;
      if (this.keyx == 0 && this.keyy == 0) {
        event.preventDefault();
        this.event = null;
        this.button = -1;
        this.disconnect();
        this.getBrowser().setCursor("DEFAULT");
        this.removeCollision();
        this.isActive_ = false;
      } else {
        this.toVector.set(this.keyx, 0, this.keyy);
        this.getFlyDirection(this.fromVector, this.toVector, this.direction);
      }
    }

    WalkViewer.prototype.initialize = function () {
      var browser = this.getBrowser();
      var element = browser.getElement();
      this.keyx = 0;
      this.keyy = 0;
      element.bind('keydown.WalkViewer', this.keydown.bind(this));
      element.bind('keyup.WalkViewer', this.keyup.bind(this));
      originalInitialize.call(this);
    }

  })
})();