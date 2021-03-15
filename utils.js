var {Datastore} = require('@google-cloud/datastore');
var datastore = new Datastore();
const PAGE_SIZE = 5;

exports.addOrUpdateOne = async (req, res, kind, operation) => {
    const entity = kind.makeEntity(kind.key, req.body, operation);
    datastore.save(entity).then((data) => {
        if (operation == "insert"){
            const id = data[0].mutationResults[0].key.path[0].id;
            req.body[datastore.KEY] = {"id": id};
        }
        else if (operation == "update"){
            const id = kind.key.path[0].id;
            req.body[datastore.KEY] = {"id": id};
        }

        res.status(201)
        .send(kind.makeResponse(req.body, req));
    })
    .catch((err) => this.serverError(err, res));
}

exports.getOne = async (req, res, kind, secure) => {
    const entity = await this.getSingleEntity(kind.key, kind.kind, res);

    if (entity) {
        const authorized = secure ? (entity.owner === req.user.sub) : true;
        if (authorized){
            res.status(200);
            const resp = kind.makeResponse(entity, req);
            res.send(resp);
        }
        else {
            res.status(403);
            res.send({ "Error": `That ${kind.kind} is owned by someone else` });
        }
    }
}

exports.getSingleEntity = async (key, kind, res) => {
    try {
        const data = await datastore.get(key);
        const response = data[0];
        if (!response){
            res.status(404);
            res.send({ "Error": `No ${kind} with that ${kind}_id found` });
            return null;
        }

        return response;
    }
    catch (err){
        this.serverError(err, res);
        return null;
    }
}

exports.getAll = (req, res, kind, secure) => {
    let query = datastore.createQuery(kind.kind).limit(PAGE_SIZE);
    
    if (secure){
        query = query.filter("owner", req.owner);
    }

    if (req.query.next){
        query.start(req.query.next);
    }

    datastore.runQuery(query)
    .then((data) => {
        const entities = data[0];
        const items = entities.map((entity) => {
            return kind.makeResponse(entity, req);
        });
        makeNext(items, data[1], req, res);
    })
    .catch((err) => {
        this.serverError(err, res);
    });

}

const makeNext = (results, info, req, res) => {
    if (info.moreResults !== Datastore.NO_MORE_RESULTS){
        const url = req.protocol + '://' + req.get('host') + req.baseUrl;
        const endCursor = encodeURIComponent(info.endCursor);
        results.push({ "next": `${url}/?next=${endCursor}`});
    }
    
    res.status(200);
    res.send(results);
}

exports.serverError = (err, res) => {
    console.log(err);
    res.status(500);
    res.send({"Error": "Something went wrong. Please try again later"});
}