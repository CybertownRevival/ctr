const db = require("../libs/db.js");
const validator = require("validator");
const memberLibs = require("../libs/member.js");

exports.addMessage = (req, res, next) => {

    var token = memberLibs.validJwt(req.headers.apitoken);
    if(!token) {
        res.status(400).json({
            error: 'Invalid or missing token.'
        });
        return;
    }


    if(parseInt(req.params.placeId) <= 0) {
        res.status(400).json({
            error: 'placeId is required.'
        });
        return;
    }

    if(validator.isEmpty(req.body.body)) {
        res.status(400).json({
            error: 'body is required.'
        });
        return;
    }

    // todo insert
    db.query("INSERT INTO message SET member_id = ?, body = ?, place_id = ?",
        [token.id, req.body.body, req.params.placeId],
        (err, results) => {
            if (err) {
                res.status(400).json({
                    error: 'A problem occurred creating message.'
                });
            } else {
                // todo, get the token
                res.status(200).json({
                    status: "success",
                    messageId: results.insertId
                });
            }
        });

}

exports.getResults = (req, res, next) => {
    let limit = 10;
    let maxLimit = 1000;
    let order = 'id';
    let orderDirection = '';
    let validOrders = ['id'];
    let validOrderDirections = ['asc','desc'];

    console.log('get Messages...')
    console.log(req.params.placeId);
    console.log(req.query);

    if(parseInt(req.params.placeId) <= 0) {
        res.status(400).json({
            error: 'placeId is required.'
        });
        return;
    }

    if(parseInt(req.query.limit) > 0 && parseInt(req.query.limit) <= maxLimit) {
        limit = parseInt(req.query.limit);
    }

    if(validOrders.includes(req.query.order)) {
        order = req.query.order;
    }

    if(validOrderDirections.includes(req.query.orderDirection)) {
        orderDirection = req.query.orderDirection;
    }


    let query = "SELECT m.id, m.body as msg, mem.username as 'userName' \
        FROM message m  \
        INNER JOIN member mem \
        ON mem.id = m.member_id \
        WHERE m.place_id = ?  \
        AND m.status = 1 \
        ORDER BY "+order+" " +orderDirection+" \
        LIMIT "+limit;
    db.query(query,
        [req.params.placeId],
        (err, results) => {
            if(err) {
                res.status(400).json({
                    error: 'A problem occurred while trying to fetch messages.'
                });
            } else {
                res.status(200).json({
                    messages: results
                });
            }
        });

}
