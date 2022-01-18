const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.encryptPassword = (passwordText) => {
    return bcrypt.hash(passwordText, saltRounds);
}

exports.createJwt = (memberId, memberUserName, avatarData) => {
    return jwt.sign({ id: memberId, userName: memberUserName, avatar: avatarData }, process.env.JWT_SECRET);
}

exports.validJwt = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch(err) {
        return false;
    }
}

