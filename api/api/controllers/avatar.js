const db = require("../libs/db.js");


exports.getResults = (req, res, next) => {
    let limit = 10;
    let maxLimit = 1000;
    let order = 'id';
    let orderDirection = '';
    let validOrders = ['id'];
    let validOrderDirections = ['asc','desc'];

    console.log('get Avatars...')

    if(parseInt(req.query.limit) > 0 && parseInt(req.query.limit) <= maxLimit) {
        limit = parseInt(req.query.limit);
    }

    if(validOrders.includes(req.query.order)) {
        order = req.query.order;
    }

    if(validOrderDirections.includes(req.query.orderDirection)) {
        orderDirection = req.query.orderDirection;
    }


    let query = "SELECT id, name \
        FROM avatar  \
        WHERE status = 1  \
        AND private = 0 \
        ORDER BY "+order+" " +orderDirection+" \
        LIMIT "+limit;
    db.query(query,
        [],
        (err, results) => {
            if(err) {
                res.status(400).json({
                    error: 'A problem occurred while trying to fetch avatars.'
                });
            } else {
                res.status(200).json({
                    avatars: results
                });
            }
        });

}
