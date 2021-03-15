const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

module.exports = function() {    
    const express = require('express');
    const router = express.Router();

    router.get('/', (req, res) => {
        const query = datastore.createQuery("User");
        datastore.runQuery(query)
        .then((data) => {
            const entities = data[0];
            const items = entities.map((entity) => {
                return {
                    "user_id": entity[datastore.KEY].name,
                    "user_name": entity.user_name
                };
            });
    
            res.status(200).send(items);
        })
        .catch((err) => {
            console.log(err);
            res.status(500);
            res.send({"Error": "Something went wrong. Please try again later"});
        });
    });

    return router;
}();

