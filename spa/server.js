const express = require('express');
const app = express();
const http = require('http').createServer(app);
const https = require('https');
const io = require('socket.io')(http);
const path = require('path');
const jwt = require('jsonwebtoken');

function webhook_message(from, message) {
    return;
    if(!process.env.CHAT_WEBHOOK_URL) return;
    let body = JSON.stringify({
        username: from,
        content: message
    });
    let req = https.request(process.env.CHAT_WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body)
        }
    });
    req.write(body);
    req.end();
}

function validJwt(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch(err) {
        return false;
    }
}

app.use(express.static("dist"));
let USERS = new Map();

// serves the SPA
app.get('/', (req, res) => {
    console.log(req);
    res.sendFile(path.join(__dirname, "/dist/index.html"));
});

/*
todo: this is like 'users online' i think
app.get('/population', (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    let population = {};
    for(let avatar of USERS.values()) {
        if(avatar.room) {
            if(!population[avatar.room]) {
                population[avatar.room] = 0;
            }
            population[avatar.room] += 1;
        }
    }
    res.send(population);
});

 */

io.on('connection', async function(socket){
    console.log('a user connected');
    //send discord message
    webhook_message("System", `${socket.id} connected.`);


    let initDetail;
    let ack;
    //setup socket's default AVATAR map reference
    USERS.set(socket, {
        pos: [0, 0, 0],
        rot: [0, 1, 0, 0]
    });

    //this joins the socket and sets the data ot initDetail. ask is the callback on the UI
    try {
        [initDetail, ack] = await new Promise((resolve, reject) => {
            socket.on("JOIN", (data, ack) => {

                //todo: validate the jwt (must be passed with every call)
                console.log(data);
                let tokenData = validJwt(data.token);

                if(!tokenData) {
                    console.error('invalid token!!!')
                    reject("Invalid Token");
                } else {
                    console.log('token Data!');
                    console.log(tokenData);
                    data.tokenData = tokenData;
                    resolve([data, ack]);
                }

            });
            setTimeout(() => reject("Timed out waiting for JOIN"), 10000);
        });
    } catch(e) {
        console.error(e);
        return;
    }


    //tell this user about the other users and positions, tell the other users about this user and position
    for(let [other_socket, av] of USERS) {
        if(USERS.get(other_socket).room === initDetail.room) {
            socket.emit("AV:new", {id: other_socket.id, avatar: av.avatar, userName: av.userName});
            socket.emit("AV", {id: other_socket.id, pos: av.pos, rot: av.rot});
            other_socket.emit("AV:new", {id: socket.id, avatar: initDetail.tokenData.avatar, userName: initDetail.tokenData.userName});
        }
    }

    //set this socket's reference AVATAR map
    //console.log(USERS);
    USERS.get(socket).avatar = initDetail.tokenData.avatar;
    USERS.get(socket).room = initDetail.room;
    USERS.get(socket).userName = initDetail.tokenData.userName;
    webhook_message("System", `${USERS.get(socket).userName} entered room \`${initDetail.room}\``);

    //join the room...
    socket.join(initDetail.room);

    // Acknolwedges to Client's JOIN that server is initialized (callback)
    ack();

    //handle avatar related calls.
    socket.on("AV", function(msg) {
        msg.id = socket.id;
        console.log(msg);
        console.log(USERS.get(socket).room);
        if(USERS.get(socket) && USERS.get(socket).room) {
            socket.to(USERS.get(socket).room).emit("AV", msg);
        }
        if(USERS.get(socket)) {
            if(msg.pos) {
                USERS.get(socket).pos = msg.pos;
            }
            if(msg.rot) {
                USERS.get(socket).rot = msg.rot;
            }
        }
    });

    //handle shared events
    socket.on("SE", function(msg) {
        console.log(msg);
        io.to(USERS.get(socket).room).emit("SE", msg);
    });

    //handle chat messages
    socket.on("CHAT", (chatData) => {
        console.log('chat message...');
        console.log(chatData);
        if(!chatData || !chatData.msg || typeof chatData.msg !== "string") return;

        if(USERS.get(socket).room) {
            webhook_message(`${USERS.get(socket).userName} in ${USERS.get(socket).room}`, chatData.msg);
            io.to(USERS.get(socket).room).emit("CHAT", {userName: USERS.get(socket).userName, msg: chatData.msg});
        }
    });

    //handle disconnection from the socket.
    socket.on("disconnect", function() {
        console.log('user disconnecting...');
        io.to(USERS.get(socket).room).emit("AV:del", {id: socket.id, userName: USERS.get(socket).userName});
        webhook_message("System", `${USERS.get(socket).userName} disconnected.`);
        USERS.delete(socket);
    });
});


const port = process.env.PORT || 8000;
http.listen(port);
console.log('listening on port:'+port);
