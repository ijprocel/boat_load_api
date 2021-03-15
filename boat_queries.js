var {Datastore} = require('@google-cloud/datastore');
var datastore = new Datastore();
var utils = require("./utils.js");

exports.addBoat = (req, res) => {
    const kind = {
        "key": datastore.key("Boat"),
        "makeEntity": this.makeBoatEntity,
        "makeResponse": this.makeBoatResponseJSON
    }
    
    utils.addOrUpdateOne(req, res, kind, "insert");
}

exports.getBoat = (req, res, id) => {
    const kind = {
        "kind": "boat",
        "key": datastore.key(["Boat", Number(id)]),
        "makeResponse": this.makeBoatResponseJSON
    }
    
    utils.getOne(req, res, kind, true);
}

exports.getAllBoats = (req, res) => {
    const kind = {
        "kind": "Boat",
        "makeResponse": this.makeBoatResponseJSON
    }

    utils.getAll(req, res, kind, true);
}

exports.updateSingleBoat = async (req, res, partial) => {
    const key = datastore.key(["Boat", Number(req.params.boat_id)]);
    const exists = await utils.getSingleEntity(key, "boat", res);
    
    if (exists && (exists.owner === req.user.sub)){
        const kind = {
            "key": key,
            "makeEntity": this.makeBoatEntity,
            "makeResponse": this.makeBoatResponseJSON
        }
        req.body.owner = req.user.sub;
        req.body.loads = exists.loads;

        if (partial){
            if (!req.body.name){
                req.body.name = exists.name;
            }
            if (!req.body.type){
                req.body.type = exists.type;
            }
            if (!req.body.length){
                req.body.length = exists.length;
            }
        }

        utils.addOrUpdateOne(req, res, kind, "update");
    }
    else if (exists){
        res.status(403);
        res.send({ "Error": "That boat is owned by someone else" });
    }
}

exports.makeBoatResponseJSON = (entity, req) => {
    const id = entity[datastore.KEY].id;
    const host = req.protocol + '://' + req.get('host');

    const loads = entity.loads.map((load) => {
        return {
            "id": load,
            "self": `${host}/loads/${load}`
        }
    });

    return {
        "id": id,
        "name": entity.name,
        "type": entity.type,
        "length": entity.length,
        "loads": loads,
        "owner": entity.owner,
        "self": `${host}/boats/${id}`
    };
}

exports.makeBoatEntity = (key, body, method) => {
    return {
        key: key,
        data: {
            "name": body.name,
            "type": body.type,
            "length": Number(body.length),
            "loads": body.loads,
            "owner": body.owner
        },
        method: method
    };
}