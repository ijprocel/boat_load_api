const boat_queries = require('./boat_queries');
const shared_queries = require('./shared_queries');
const validate = require('./validators');
const checkJwt = require('./jwt.js').checkJwt;

module.exports = function() {    
    const express = require('express');
    const router = express.Router();

    router.post("/", checkJwt, (req, res) => {
        const okay_request = validate.contentType(req, res) &&
                            validate.accepts(req, res) &&
                            validate.boatParamsPutPost(req, res);
                            
        req.body.owner = req.user.sub;
        req.body.loads = [];
        if (okay_request){
            boat_queries.addBoat(req, res);
        }
    });

    router.get("/:boat_id", checkJwt, (req, res) => {
        const okay_request = validate.accepts(req, res, true);

        if (okay_request){
            boat_queries.getBoat(req, res, req.params.boat_id);
        }
    });

    router.get("/", checkJwt, (req, res) => {
        const okay_request = validate.accepts(req, res, true);

        req.owner = req.user.sub;
        if (okay_request){
            boat_queries.getAllBoats(req, res);
        }
    });

    router.put("/:boat_id", checkJwt, (req, res) => {
        const okay_request = validate.contentType(req, res) &&
                            validate.accepts(req, res) &&
                            validate.boatParamsPutPost(req, res);
                            
        req.body.owner = req.user.sub;
        if (okay_request){
            boat_queries.updateSingleBoat(req, res, false);
        }
    });

    router.patch("/:boat_id", checkJwt, (req, res) => {
        const okay_request = validate.contentType(req, res) &&
                            validate.accepts(req, res);
                            
        req.body.owner = req.user.sub;
        if (okay_request){
            boat_queries.updateSingleBoat(req, res, true);
        }
    });

    router.delete("/:boat_id", checkJwt, (req, res) => {
        shared_queries.deleteSingleBoat(res, req.params.boat_id, req.user.sub);
    });

    router.put("/:boat_id/loads/:load_id", (req, res) => {
        shared_queries.addLoadToBoat(req.params.boat_id, req.params.load_id, res);
    });

    router.delete("/:boat_id/loads/:load_id", (req, res) => {
        shared_queries.removeLoadFromBoat(req.params.boat_id, req.params.load_id, res);
    });

    router.patch("/", validate.operationOnRoot);

    router.put("/", validate.operationOnRoot);

    router.delete("/", validate.operationOnRoot);

    return router;
}();

