var {Datastore} = require('@google-cloud/datastore');
var datastore = new Datastore();
var utils = require("./utils.js");
const shared_queries = require("./shared_queries");

exports.addLoad = (req, res) => {
    const kind = {
        "key": datastore.key("Load"),
        "makeEntity": this.makeLoadEntity,
        "makeResponse": this.makeLoadResponseJSON
    }
    
    utils.addOrUpdateOne(req, res, kind, "insert");
}

exports.getLoad = (req, res, id) => {
    const kind = {
        "kind": "load",
        "key": datastore.key(["Load", Number(id)]),
        "makeResponse": this.makeLoadResponseJSON
    }
    
    utils.getOne(req, res, kind)
}

exports.getAllLoads = (req, res) => {
    const kind = {
        "kind": "Load",
        "makeResponse": this.makeLoadResponseJSON
    }

    utils.getAll(req, res, kind, false);
}

exports.updateSingleLoad = async (req, res, partial) => {
    const key = datastore.key(["Load", Number(req.params.load_id)]);
    const exists = await utils.getSingleEntity(key, "load", res);
    
    if (exists){
        const kind = {
            "key": key,
            "makeEntity": this.makeLoadEntity,
            "makeResponse": this.makeLoadResponseJSON
        }
        req.body.carrier_id = exists.carrier_id;
        req.body.carrier_name = exists.carrier_name;

        if (partial){
            if (!req.body.content){
                req.body.content = exists.content;
            }
            if (!req.body.weight){
                req.body.weight = exists.weight;
            }
            if (!req.body.delivery_date){
                req.body.delivery_date = exists.delivery_date;
            }
        }

        utils.addOrUpdateOne(req, res, kind, "update");
    }
}

exports.makeLoadResponseJSON = (entity, req) => {
    const id = entity[datastore.KEY].id;
    const host = req.protocol + '://' + req.get('host');
    
    let carrier = {};
    if (entity.carrier_id){
        carrier = {
            "id": entity.carrier_id,
            "name": entity.carrier_name,
            "self": `${host}/boats/${entity.carrier_id}`
        }
    }

    return {
        "id": id,
        "weight": entity.weight,
        "carrier": carrier,
        "content": entity.content,
        "delivery_date": entity.delivery_date,
        "self": `${host}/loads/${id}`
    };
}

exports.makeLoadEntity = (key, body, method) => {
    return {
        key: key,
        data: {
            "weight": body.weight,
            "carrier_name": body.carrier_name,
            "carrier_id": body.carrier_id,
            "content": body.content,
            "delivery_date": body.delivery_date
        },
        method: method
    };
}