const load_queries = require('./load_queries');
const shared_queries = require('./shared_queries');
const validate = require('./validators');
const checkJwt = require('./jwt.js').checkJwt;

module.exports = function() {    
    const express = require('express');
    const router = express.Router();

    router.post('/', (req, res) => {
        const okay_request = validate.contentType(req, res) &&
                            validate.accepts(req, res) &&
                            validate.loadParamsPutPost(req, res);

        req.body.carrier_id = null;
        req.body.carrier_name = null;
        if (okay_request){
            load_queries.addLoad(req, res);
        }
    });

    router.get('/:load_id', (req, res) => {
        const okay_request = validate.accepts(req, res, true);

        if (okay_request){
            load_queries.getLoad(req, res, req.params.load_id);
        }
    });

    router.get('/', (req, res) => {
        const okay_request = validate.accepts(req, res, true);

        if (okay_request){
            load_queries.getAllLoads(req, res);
        }
    });

    router.put("/:load_id", async (req, res) => {
        const okay_request = validate.contentType(req, res) &&
                            validate.accepts(req, res) &&
                            validate.loadParamsPutPost(req, res);
                            
        if (okay_request){
            load_queries.updateSingleLoad(req, res, false);
        }
    });

    router.patch("/:load_id", async (req, res) => {
        const okay_request = validate.contentType(req, res) &&
                            validate.accepts(req, res);

        if (okay_request){
            load_queries.updateSingleLoad(req, res, true);
        }
    });

    router.delete('/:load_id', async (req, res) => {
        shared_queries.deleteSingleLoad(res, req.params.load_id);
    });

    router.patch("/", validate.operationOnRoot);

    router.put("/", validate.operationOnRoot);

    router.delete("/", validate.operationOnRoot);

    return router
}();