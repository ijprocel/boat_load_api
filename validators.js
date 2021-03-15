exports.hasJwt = (req, res) => {
    if (!req.user){
        res.status(401);
        res.send({ "Error": "Missing JWT" });
        return;
    }
    return true;
}

exports.operationOnRoot = (req, res) => {
    res.status(405);
    res.send( {"Error": "Invalid operation for this resource"} );
}

exports.contentType = (req, res) => {
    if (!req.is("application/json")){
        res.status(415);
        res.send({ "Error": "Request must be JSON" });
        return;
    }

    return true;
}

exports.accepts = (req, res,) => {
    if (!req.accepts('application/json')){
        res.status(406);
        res.send({ "Error": "Response can only be JSON" });
        return;
    }

    return true;
}

exports.boatParamsPutPost = (req, res) => {
    const body = req.body;
    if (!body.name || !body.type || !body.length){
        res.status(400);
        res.send({ "Error": "Missing boat attributes" });
        return;
    }
    return true;
}

exports.loadParamsPutPost = (req, res) => {
    const body = req.body;
    if (!body.weight || !body.content || !body.delivery_date){
        res.status(400);
        res.send({ "Error": "Missing load attributes" });
        return;
    }
    return true;
}