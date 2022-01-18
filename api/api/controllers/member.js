const db = require("../libs/db.js");
const memberLibs = require("../libs/member.js");
const avatarLibs = require("../libs/avatar.js");
const validator = require("validator");
const bcrypt = require("bcrypt");

exports.signup = (req, res, next) => {
    function _checkDupEmail() {
        console.log("checking dup email...");
        db.query(
            "SELECT COUNT(1) as total FROM member WHERE email = ?",
            [req.body.email],
            (err, results) => {
                if (err) {
                    res.status(400).json({
                        error: "A problem occurred during existing account check.",
                    });
                } else if (results[0].total > 0) {
                    res.status(400).json({
                        error: "An account with this email already exists.",
                    });
                } else {
                    _checkDupUsername();
                }
            }
        );
    }

    function _checkDupUsername() {
        console.log("check dup username..");
        db.query(
            "SELECT COUNT(1) as total FROM member WHERE username = ?",
            [req.body.username],
            (err, results) => {
                if (err) {
                    res.status(400).json({
                        error: "A problem occurred during username check.",
                    });
                } else if (results[0].total > 0) {
                    res.status(400).json({
                        error: "An account with this username already exists.",
                    });
                } else {
                    _createUser();
                }
            }
        );
    }

    async function _createUser() {
        console.log("create the user");
        var hashedPassword = await memberLibs.encryptPassword(
            req.body.password
        );

        db.query(
            "INSERT INTO member SET email = ?, username = ?, password = ?, avatar_id = 1",
            [req.body.email, req.body.username, hashedPassword],
            (err, results) => {
                if (err) {
                    console.log(err);
                    res.status(400).json({
                        error: "A problem occurred during account creation.",
                    });
                } else {
                    avatarLibs.getAvatarObjectForJwt(1).then((avatarData) => {
                        var token = memberLibs.createJwt(
                            results.insertId,
                            req.body.username,
                            avatarData
                        );
                        res.status(200).json({
                            message: "Signup Completed",
                            token: token,
                            username: req.body.username,
                        });
                    });
                }
            }
        );
    }

    if (
        typeof req.body.email === "undefined" ||
        validator.isEmpty(req.body.email) ||
        typeof req.body.username === "undefined" ||
        validator.isEmpty(req.body.username) ||
        typeof req.body.password === "undefined" ||
        validator.isEmpty(req.body.password)
    ) {
        console.log("missing signup details");
        res.status(400).json({
            error: "All fields are required.",
        });
        return;
    }

    if (!validator.matches(req.body.username, "^[a-zA-Z0-9_.-]*$")) {
        console.log("username is invalid");
        res.status(400).json({
            error: "Username must be alphanumeric.",
        });
        return;
    }

    //todo this should be expanded on with rude words and any other security related words
    var restrictedUsernames = [
        "cybertown",
        "admin",
        "moderator",
        "security",
        "officer",
        "support",
        "mina",
        "owner",
    ];

    //note: this checks in the username CONTAINS any of the restrited strings, not exact matches
    if (
        restrictedUsernames.some((v) =>
            req.body.username.toLowerCase().includes(v)
        )
    ) {
        // There's at least one
        res.status(400).json({
            error: "Username is not allowed.",
        });
        return;
    }

    if (!validator.isEmail(req.body.email)) {
        console.log("email is invalid");
        res.status(400).json({
            error: "Provide a valid email address.",
        });
        return;
    }

    _checkDupEmail();
};

exports.login = async (req, res, next) => {
    if (
        typeof req.body.username === "undefined" ||
        typeof req.body.password === "undefined"
    ) {
        console.log("missing login details");
        res.status(400).json({
            error: "All fields are required.",
        });
        return;
    }

    db.query(
        "SELECT id, username, email, avatar_id, password FROM member WHERE username = ?",
        [req.body.username],
        async (err, results) => {
            if (err) {
                console.log(err);
                res.status(400).json({
                    error: "A problem occurred while trying to login.",
                });
            } else if (results.length <= 0) {
                res.status(400).json({
                    error: "Account not found.",
                });
            } else {
                var validPassword = await bcrypt.compare(
                    req.body.password,
                    results[0].password
                );

                if (!validPassword) {
                    res.status(400).json({
                        error: "Incorrect login details.",
                    });
                } else {
                    avatarLibs
                        .getAvatarObjectForJwt(results[0].avatar_id)
                        .then((avatarData) => {
                            var token = memberLibs.createJwt(
                                results[0].id,
                                results[0].username,
                                avatarData
                            );
                            res.status(200).json({
                                message: "Login Successful",
                                token: token,
                                username: results[0].username,
                            });
                        });
                }
            }
        }
    );
};
exports.session = (req, res, next) => {
    console.log(req.headers.apitoken);

    var token = memberLibs.validJwt(req.headers.apitoken);
    if (!token) {
        res.status(400).json({
            error: "Invalid or missing token.",
        });
        return;
    }
    console.log(token);
    res.status(200).json({
        message: "success",
        token: req.headers.apitoken,
        user: token,
    });
};

exports.updatePassword = (req, res, next) => {
    console.log(req.headers.apitoken);

    var token = memberLibs.validJwt(req.headers.apitoken);
    if (!token) {
        res.status(400).json({
            error: "Invalid or missing token.",
        });
        return;
    }
    console.log(token);

    if (
        req.body.newPassword !== req.body.newPassword2 ||
        req.body.newPassword.trim() === ""
    ) {
        res.status(400).json({
            error: "Please enter your new password the same twice.",
        });
        return;
    }

    // validate the password
    db.query(
        "SELECT id, password FROM member WHERE id = ?",
        [token.id],
        async (err, results) => {
            if (err) {
                console.log(err);
                res.status(400).json({
                    error: "A problem occurred while trying to fetch your account.",
                });
            } else if (results.length <= 0) {
                res.status(400).json({
                    error: "Account not found.",
                });
            } else {
                var validPassword = await bcrypt.compare(
                    req.body.currentPassword,
                    results[0].password
                );

                if (!validPassword) {
                    res.status(400).json({
                        error: "Incorrect current password.",
                    });
                } else {
                    var hashedPassword = await memberLibs.encryptPassword(
                        req.body.newPassword
                    );

                    db.query(
                        "UPDATE member SET password = ? WHERE id = ?",
                        [hashedPassword, token.id],
                        (err, results) => {
                            if (err) {
                                console.log(err);
                                res.status(400).json({
                                    error: "A problem occurred during password upate.",
                                });
                            } else {
                                // return a success
                                res.status(200).json({
                                    message: "success",
                                });
                            }
                        }
                    );
                }
            }
        }
    );
};

exports.updateAvatar = (req, res, next) => {
    var token = memberLibs.validJwt(req.headers.apitoken);
    if (!token) {
        res.status(400).json({
            error: "Invalid or missing token.",
        });
        return;
    }

    if (req.body.avatarId <= 0) {
        res.status(400).json({
            error: "Please pass an avatarId.",
        });
        return;
    }

    db.query(
        "SELECT id FROM avatar WHERE id = ? AND status = 1 AND private = 0",
        [req.body.avatarId],
        async (err, results) => {
            if (err) {
                console.log(err);
                res.status(400).json({
                    error: "A problem occurred while trying to fetch the avatar.",
                });
            } else if (results.length <= 0) {
                res.status(400).json({
                    error: "Avatar not found.",
                });
            } else {
                db.query(
                    "UPDATE member SET avatar_id = ? WHERE id = ?",
                    [req.body.avatarId, token.id],
                    (err, results) => {
                        if (err) {
                            console.log(err);

                            res.status(400).json({
                                error: "A problem occurred during avatar upate.",
                            });
                        } else {
                            // return a success
                            avatarLibs
                                .getAvatarObjectForJwt(req.body.avatarId)
                                .then((avatarData) => {
                                    var newToken = memberLibs.createJwt(
                                        token.id,
                                        token.userName,
                                        avatarData
                                    );
                                    res.status(200).json({
                                        message: "Success",
                                        token: newToken,
                                        username: token.userName,
                                    });
                                });
                        }
                    }
                );
            }
        }
    );
};
