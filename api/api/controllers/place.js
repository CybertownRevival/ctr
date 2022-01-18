const db = require("../libs/db.js");
const memberLibs = require("../libs/place.js");

exports.getPlace = (req, res, next) => {
    console.log('get Place...')
    console.log(req.params.slug);
    db.query("SELECT id, slug, assets_dir, world_filename, description, name FROM place WHERE slug = ? AND status = 1",
        [req.params.slug],
        (err, results) => {
            if(err) {
                res.status(400).json({
                    error: 'A problem occurred while trying to fetch place.',
                    err
                });
            } else if (results.length <= 0) {
                res.status(400).json({
                    error: 'unknown place.'
                });
            } else {
                res.status(200).json({
                    place: results[0]
                });
            }
        });
}

exports.getPlaceObjects = (req, res, next) => {
    console.log('get Place Objects...')
    console.log(req.params.slug);
    db.query("SELECT id, slug FROM place WHERE slug = ? AND status = 1",
        [req.params.slug],
        (err, results) => {
            if(err) {
                res.status(400).json({
                    error: 'A problem occurred while trying to fetch place.',
                    err
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
                            object_instance: oResults.map(obj => {
                                obj.position = JSON.parse(obj.position);
                                obj.rotation = JSON.parse(obj.rotation);
                                return obj;
                            })
                        });
                    })
            }
        });
}