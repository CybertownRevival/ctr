const http = require('http');
const express = require('express');
const morgan = require('morgan');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const memberRoutes = require("./api/routes/member.js");
const placeRoutes = require("./api/routes/place.js");
const messageRoutes = require("./api/routes/message.js");
const objectInstanceRoutes = require("./api/routes/object_instance.js");
const avatarRoutes = require("./api/routes/avatar.js");


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, apitoken"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});


app.use("/api/member", memberRoutes);
app.use("/api/place", placeRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/object_instance", objectInstanceRoutes);
app.use("/api/avatar", avatarRoutes);


app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

const server = http.createServer(app);
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Listening on port: "+port);

});
