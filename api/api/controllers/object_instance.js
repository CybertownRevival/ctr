const db = require("../libs/db.js");
const validator = require("validator");

exports.updateObjectInstancePosition = (req, res, next) => {
    console.log('post Place Objects...')
    console.log(req.params.id);
    console.log(req.body.position);
    console.log(req.body.rotation);

    if(
        typeof req.body.position.x === 'undefined'
        || typeof req.body.position.y === 'undefined'
        || typeof req.body.position.z === 'undefined'
        || typeof req.body.rotation.x === 'undefined'
        || typeof req.body.rotation.y === 'undefined'
        || typeof req.body.rotation.z === 'undefined'
        || typeof req.body.rotation.angle === 'undefined'
    ) {
        res.status(400).json({
            error: 'invalid position or rotation.'
        });
        return;
    }

    var position = JSON.stringify({
        x: parseFloat(req.body.position.x),
        y: parseFloat(req.body.position.y),
        z: parseFloat(req.body.position.z)
    });
    var rotation = JSON.stringify({
        x: parseFloat(req.body.rotation.x),
        y: parseFloat(req.body.rotation.y),
        z: parseFloat(req.body.rotation.z),
        angle: parseFloat(req.body.rotation.angle)
    });

    db.query("UPDATE object_instance SET position = ?, rotation = ? WHERE id = ?",
        [position, rotation, req.params.id],
        (err, results) => {
            if(err) {
                res.status(400).json({
                    error: 'A problem occurred while trying to save object position.'
                });
            } else {
                res.status(200).json({
                    'status': 'success'
                });
            }
    })

    /*
    db.query("SELECT id, slug FROM place WHERE slug = ? AND status = 1",
        [req.params.slug],
        (err, results) => {
            if(err) {
                res.status(400).json({
                    error: 'A problem occurred while trying to fetch place.'
                });
            } else if (results.length <= 0) {
                res.status(400).json({
                    error: 'unknown place.'
                });
            } else {
                db.query("SELECT oi.id, oi.object_id, o.filename, o.name, oi.position, oi.rotation \
                    FROM object_instance AS oi \
                    INNER JOIN object as o \
                    ON o.id = oi.object_id \
                    WHERE oi.place_id = ?",
                    [results[0].id],
                    (oErr, oResults) => {
                        res.status(200).json({
                            object_instance: oResults
                        });
                    })
            }
        });
        */
}