
const db = require("../libs/db.js");

exports.getAvatarObjectForJwt = (avatarId) => {
    return new Promise(function (resolve, reject) {
        let query = "SELECT * \
        FROM avatar  \
        WHERE id = ?  \
        AND status = 1 ";

        db.query(query, [avatarId], (err, results) => {
            if (err) {
                reject();
            } else {
                let avatarData = results[0];
                resolve({
                    'id': avatarData.id,
                    'name': avatarData.name,
                    'filename': avatarData.filename,
                    'gestures': JSON.parse(avatarData.gestures)
                });
            }
        });

    });
}