const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

const utils = require("./utils.js");
const boat_queries = require("./boat_queries.js");
const load_queries = require("./load_queries.js");

const getBoatAndLoad = async (boat_id, load_id, res) => {
    const keys = [
        datastore.key(["Boat", Number(boat_id)]),
        datastore.key(["Load", Number(load_id)])
    ];

    try {
        const resp = await datastore.get(keys);
        if (resp[0].length < 2){
            res.status(404)
            .send({ "Error": "That boat and/or load does not exist" });
            return [null, null];
        }

        return resp[0];
    }
    catch(err) {
        utils.serverError(err, res);
        return [null, null];
    }
}

const updateBoatLoad = async (boat, load, res) => {
    const boat_key = boat[datastore.KEY];
    const load_key = load[datastore.KEY];

    const updatedEntities = [
        boat_queries.makeBoatEntity(boat_key, boat, "update"),
        load_queries.makeLoadEntity(load_key, load, "update")
    ];

    const transaction = datastore.transaction();
    await transaction.run();

    transaction.save(updatedEntities);

    transaction.commit().then((resp) => {
        res.status(204).send();
    })
    .catch((err) => {
        utils.serverError(err, res);
    });
}

exports.addLoadToBoat = async (boat_id, load_id, res) => {
    const [boat, load] = await getBoatAndLoad(boat_id, load_id, res);

    if (boat && load) {
        if (load.carrier_id){
            res.status(403);
            res.send({ "Error": "That load is already on a boat" });
            return;
        }
        
        boat.loads.push(load_id);
        load.carrier_id = boat_id;
        load.carrier_name = boat.name;

        updateBoatLoad(boat, load, res);
    }
}

exports.removeLoadFromBoat = async (boat_id, load_id, res) => {
    const [boat, load] = await getBoatAndLoad(boat_id, load_id, res);

    if (boat && load) {
        if (load.carrier_id != boat_id){
            res.status(403);
            res.send({ "Error": "That load is not on the boat" });
            return;
        }

        const idx_to_delete = boat.loads.indexOf(load_id);
        if (idx_to_delete > -1){
            boat.loads.splice(idx_to_delete, 1);
        }

        boat.loads.splice(idx_to_delete, 1);
        load.carrier_id = null;
        load.carrier_name = null;

        updateBoatLoad(boat, load, res);
    }
}

exports.deleteSingleLoad = async (res, load_id) => {
    const load_key = datastore.key(["Load", Number(load_id)]);
    const load = await utils.getSingleEntity(load_key, "load", res);

    if (load){
        try {
            const transaction = datastore.transaction();
            await transaction.run();
            
            if (load.carrier_id){
                const boat_key = datastore.key(["Boat", Number(load.carrier_id)]);
                const response = await datastore.get(boat_key);
                const boat = response[0];
                
                const idx_to_delete = boat.loads.indexOf(load_id);
                if (idx_to_delete > -1){
                    boat.loads.splice(idx_to_delete, 1);
                }
                
                const updatedBoat = boat_queries.makeBoatEntity(boat_key, boat, "update");

                transaction.save(updatedBoat);
            }
            
            transaction.delete(load_key);
            
            transaction.commit().then((resp) => {
                res.status(204).send();
            });
        }
        catch(err) {
            utils.serverError(err, res);
        }
    }
}

exports.deleteSingleBoat = async (res, boat_id, boat_owner) => {
    const boat_key = datastore.key(["Boat", Number(boat_id)]);
    const boat = await utils.getSingleEntity(boat_key, "boat", res);

    if (boat && (boat.owner === boat_owner)){
        try {
            const transaction = datastore.transaction();
            await transaction.run();

            if (boat.loads.length > 0){
                const load_keys = boat.loads.map((load_id) => 
                    datastore.key(["Load", Number(load_id)])
                );
                const response = await datastore.get(load_keys);
                const loads_on_boat = response[0];

                const updated_loads = loads_on_boat.map((load) => {
                    load.carrier_id = null;
                    load.carrier_name = null;
                    const key = load[Datastore.KEY];
                    return load_queries.makeLoadEntity(key, load, "update");
                });
                
                transaction.save(updated_loads);
            }
            
            transaction.delete(boat_key);

            transaction.commit().then((resp) => {
                res.status(204).send();
            });
        }
        catch (err) {
            utils.serverError(err, res);
        }
    }
    else if (boat){
        res.status(403);
        res.send({ "Error": "That boat is owned by someone else" })
    }
}