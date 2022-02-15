/*eslint no-undef: 0*/
/*eslint no-unused-vars: 0*/

BxxEvents.addEventListener("INIT:network", function (e) {

  function system(msg) {
    BxxEvents.dispatchEvent(new CustomEvent("CHAT:system", { detail: { msg: msg } }));
  }

  let initDetail = e.detail;
  let socket = io();
  BxxEvents.addEventListener("SE:toServer", function (e) {
    socket.emit("SE", e.detail);
  });
  socket.on("SE", function (e) {
    BxxEvents.dispatchEvent(new CustomEvent("SE:fromServer", { detail: e }));
  });
  BxxEvents.addEventListener("CHAT:toServer", function (e) {
    socket.emit("CHAT", e.detail);
  });
  socket.on("CHAT", function (e) {
    BxxEvents.dispatchEvent(new CustomEvent("CHAT:fromServer", { detail: e }));
  });
  BxxEvents.addEventListener("AV:toServer", function (e) {
    socket.emit("AV", e.detail);
  });
  socket.on("AV", function (e) {
    BxxEvents.dispatchEvent(new CustomEvent("AV:fromServer", { detail: e }));
  });
  socket.on("AV:del", function (e) {
    BxxEvents.dispatchEvent(new CustomEvent("AV:fromServer:del", { detail: e }));
  });
  socket.on("AV:new", function (e) {
    BxxEvents.dispatchEvent(new CustomEvent("AV:fromServer:new", { detail: e }));
  });
  socket.on("connect", function () {
    socket.emit("JOIN", {
      avatar: initDetail.avatar,
      room: initDetail.room,
      nick: initDetail.nick
    }, function () {
      // JOIN ACK
      console.log("Got JOIN ack");
      system("Joined room.");
      const browser = X3D.getBrowser();
      socket.emit("AV", {
        detail: {
          pos: [browser.viewpointPosition.x, browser.viewpointPosition.y, browser.viewpointPosition.z],
          rot: [browser.viewpointOrientation.x, browser.viewpointOrientation.y, browser.viewpointOrientation.z, browser.viewpointOrientation.angle]
        }
      });
    });
  });
  socket.on("disconnect", () => system("Disconnected..."));
  socket.on("reconnect", () => system("Reconnecting..."));
});
