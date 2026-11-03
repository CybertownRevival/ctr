const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const https = require("https");
const io = require("socket.io")(server, {
    pingInterval: 10000, 
    pingTimeout: 30000
    });
const path = require("path");
const jwt = require("jsonwebtoken");
const package = require("./package.json");
const badwords = require("badwords-list");
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

function getPrimaryRole(token) {
    return new Promise((resolve, reject) => {
        const req = http.get({
            hostname: "ct-api",
            port: 3000,
            path: "/api/member/getrolename",
            headers: {
                apitoken: token,
            },
        }, (res) => {
            let body = "";

            res.on("data", (chunk) => {
                body += chunk;
            });

            res.on("end", () => {
                if (res.statusCode !== 200) {
                    reject(new Error("Role lookup failed"));
                    return;
                }

                try {
                    const data = JSON.parse(body);
                    resolve(data.PrimaryRoleName?.[0]?.name || "");
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on("error", reject);
        req.setTimeout(3000, () => {
            req.destroy(new Error("Role lookup timed out"));
        });
    });
}

app.use(express.static("dist"));

// serves the SPA
app.get("/", (req, res) => {
    console.log(req);
    res.sendFile(path.join(__dirname, "/dist/index.html"));
});

io.on("connection", async function(socket) {
    console.log("a user connected");
    webhookMessage("System", `${socket.id} connected.`);

    //setup socket's default AVATAR map reference
    USERS.set(socket, {
        pos: [0, 0, 0],
        rot: [0, 1, 0, 0],
    });

    // inform the client about the server's version number
    socket.emit("VERSION", { version: package.version });

    socket.on("JOIN", (data) => {
        const tokenData = validJwt(data.token);
        if (tokenData) {
            const { room } = data;
            USERS.get(socket).avatar = tokenData.avatar;
            USERS.get(socket).room = room;
            USERS.get(socket).username = tokenData.username;
            USERS.get(socket).token = data.token;

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
            webhookMessage(
                "System",
                `${tokenData.username} entered room \`${room}\``
            );
        } else {
            console.error("invalid token!");
        }
    });

    //handle avatar related calls.
    socket.on("AV", function(msg) {
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
    socket.on("SE", function(msg) {
        console.log(msg);
        io.to(USERS.get(socket).room).emit("SE", msg);
    });

    socket.on('update-object', function(object) {
        socket.broadcast.emit('update-object', {
            obj_id: object.obj_id,
            place_id: object.place_id,
            member_username: object.member_username,
            buyer_username: object.buyer_username,
        });
    });

    //handle shared events
    socket.on("SO", function(msg) {
        console.log(msg);
        const user = USERS.get(socket);

        if (user?.room) {
            const clientsInRoom = io.sockets.adapter.rooms.get(user.room);
            for (const clientId of clientsInRoom) {
                if (clientId === socket.id) continue;
                const clientSocket = io.sockets.sockets.get(clientId);
                const user = USERS.get(clientSocket);
                if (user) {
                    clientSocket.emit("SO", msg);
                }
            }
        }
    });

    //handle notifications
    socket.on('security-alert', function(data) {
        socket.broadcast.emit('new-security-alert', {
            data:data,
        });
    });

    //handle community moderation
    socket.on('moderation', function(data) {
        socket.broadcast.emit('moderation_event', {
            data:data,
        });
    });

    //handle chat messages
    socket.on("CHAT", async (chatData) => {
        if (!chatData || typeof chatData.msg !== "string" || !chatData.msg) {
            return;
        }

        const user = USERS.get(socket);

        if (!user?.room || !user?.token) {
            return;
        }

        if (chatData.msg.match(badwords.regex)) {
        console.log(`${user.username} used a banned word in ${user.room}`);
            return;
        }

        let role = "";

        if (chatData.role) {
            try {
                role = await getPrimaryRole(user.token);
            } catch (error) {
                console.error("Chat role verification failed:", error.message);
            }
        }

        io.to(user.room).emit("CHAT", {
            username: user.username,
            id: chatData.msg_id,
            msg: chatData.msg,
            role,
            new: true,
            exp: chatData.exp,
        });
    });

    socket.on("unsubscribe", () => {
        const user = USERS.get(socket);
        socket.leave(user.room);
        socket.to(user.room).emit("AV:del", {
            id: socket.id,
            username: user.username,
        });

        console.log(`User '${user.username}' left ${user.room}`);
        webhookMessage("System", `${user.username} left ${user.room}`);
    });

    //handle disconnection from the socket.
    socket.on("disconnect", function() {
        const user = USERS.get(socket);
        io.to(user?.room).emit("AV:del", {
            id: socket.id,
            username: user.username,
        });
        USERS.delete(socket);
        console.log(`User '${user?.username}' disconnected`);
    });
});

const port = process.env.WEBSOCKET_PORT || 8000;
server.listen(port);
console.log(`listening on port:${port}`);
