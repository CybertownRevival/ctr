const express = require("express");
const app = express();
const http = require('http').createServer(app);
const https = require('https');
const io = require('socket.io')(http);
const path = require('path');
const jwt = require('jsonwebtoken');
const package = require('./package.json');
const badwords = require('badwords-list');
const USERS = new Map();

function webhookMessage(from, message) {
  return;
  if (!process.env.CHAT_WEBHOOK_URL) return;
  const body = JSON.stringify({
    username: from,
    content: message,
  });
  const req = https.request(process.env.CHAT_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  });
  req.write(body);
  req.end();
}

function validJwt(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return false;
  }
}

app.use(express.static("dist"));

// serves the SPA
app.get("/", (req, res) => {
  console.log(req);
  res.sendFile(path.join(__dirname, "/dist/index.html"));
});

io.on("connection", async function (socket) {
  console.log("a user connected");
  webhookMessage("System", `${socket.id} connected.`);

  //setup socket's default AVATAR map reference
  USERS.set(socket, {
    pos: [0, 0, 0],
    rot: [0, 1, 0, 0],
  });

  // inform the client about the server's version number
  socket.emit("VERSION", { version: package.version });

  socket.on("JOIN", data => {
    const tokenData = validJwt(data.token);
    if (tokenData) {
      const { room } = data;
      USERS.get(socket).avatar = tokenData.avatar;
      USERS.get(socket).room = room;
      USERS.get(socket).username = tokenData.username;

      // inform other members of the room that someone joined
      socket.to(room).emit("AV:new", {
        id: socket.id,
        avatar: tokenData.avatar,
        username: tokenData.username,
      });

      socket.join(room);
      // provide the new user with data about the current users in the room
      const clientsInRoom = io.sockets.adapter.rooms.get(room);
      for (const clientId of clientsInRoom) {
        if (clientId === socket.id) continue;
        const clientSocket = io.sockets.sockets.get(clientId);
        const user = USERS.get(clientSocket);
        if (user) {
          const { avatar, pos, rot, username } = user;
          socket.emit("AV:new", {
            avatar,
            id: clientId,
            username,
          });
          socket.emit("AV", {
            id: clientId,
            pos,
            rot,
          });
        }
      }

      console.log(`User '${tokenData.username}' entered room ${room}`);
      webhookMessage("System", `${tokenData.username} entered room \`${room}\``);
    } else {
      console.error("invalid token!");
    }
  });

  //handle avatar related calls.
  socket.on("AV", function (msg) {
    msg.id = socket.id;
    const user = USERS.get(socket);
    if (user?.room) {
      socket.to(user.room).emit("AV", msg);
    }
    if (user) {
      if (msg.pos) {
        USERS.get(socket).pos = msg.pos;
      }
      if (msg.rot) {
        USERS.get(socket).rot = msg.rot;
      }
    }
  });

  //handle shared events
  socket.on("SE", function (msg) {
    console.log(msg);
    io.to(USERS.get(socket).room).emit("SE", msg);
  });

  //handle chat messages
  socket.on("CHAT", (chatData) => {
    console.log("chat message...");
    if (!chatData || !chatData.msg || typeof chatData.msg !== "string") return;
    const user = USERS.get(socket);
    const bannedwords = badwords.regex;
    if (bannedwords.test(chatData.msg)){
      console.log(`${user.username} used a banned word in ${user.room}`);
      return;
    }
    else {
      if (user?.room) {
        webhookMessage(`${user.username} in ${user.room}`, chatData.msg);
        io.to(user.room).emit("CHAT", {
          username: user.username,
          msg: chatData.msg,
          role: chatData.role,
          new: true,
        });
      }
    }
  });

  socket.on("unsubscribe", () => {
    const user = USERS.get(socket);
    socket.leave(user.room);
    socket.to(user.room)
      .emit("AV:del", {
        id: socket.id,
        username: user.username,
      });

    console.log(`User '${user.username}' left ${user.room}`);
    webhookMessage("System", `${user.username} left ${user.room}`);
  });

  //handle disconnection from the socket.
  socket.on("disconnect", function () {
    const user = USERS.get(socket);
    io.to(user?.room)
      .emit("AV:del", {
        id: socket.id,
        username:user.username,
      });
    USERS.delete(socket);
    console.log(`User '${user?.username}' disconnected`);
  });
});

const port = process.env.WEBSOCKET_PORT || 8000;
http.listen(port);
console.log(`listening on port:${  port}`);
