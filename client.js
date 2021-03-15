const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const session = require("express-session");
const crypto = require("crypto");

const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

const handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(session({
    secret: "***********",
    saveUninitialized: false,
    resave: false
}));

app.enable("trust proxy");

const CLIENT_ID = "***********";
const CLIENT_SECRET = "***********";
const DOMAIN = "***********";
const CALLBACK = "/user-info";
const CONNECTION = "Username-Password-Authentication";

app.all('/', (req, res) => {
    res.redirect('/welcome');    
});

app.get('/welcome', (req, res) => {
    const host = req.protocol + '://' + req.get('host');
    const callback = host + CALLBACK;
    const state = randomString(40);
    req.session.state = state;
    res.redirect(
        `https://${DOMAIN}/authorize?response_type=code&client_id=${CLIENT_ID}&connection=${CONNECTION}&redirect_uri=${callback}&state=${state}`
    );
});

app.get('/user-info', (req, res) => {
    const host = req.protocol + '://' + req.get('host');
    const callback = host + CALLBACK;

    if (req.query.state != req.session.state){
        res.status(403).send();
        return;
    }
    
    const options = {
        method: 'POST',
        url: `https://${DOMAIN}/oauth/token`,
        headers: { 'content-type': 'application/json' },
        data: {
            grant_type: 'authorization_code',
            code: req.query.code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: callback
        },
    };

    axios.request(options).then(function (response) {
        res.send({"jwt": response.data.id_token});
        getAndSaveUsername(response.data.access_token);
    })
    .catch((error) => 
        console.error(error.response.data)
    );
});

function getAndSaveUsername(access_token){
    const user_options = {
        method: 'GET',
        url: `https://${DOMAIN}/userinfo`,
        headers: { 'content-type': 'application/json', 'Authorization': `Bearer ${access_token}` }
    };

    axios.request(user_options).then((response) => {
        const user_entity = {
            key: datastore.key(["User", response.data.sub]),
            data: { "user_name": response.data.name }
        }
        datastore.save(user_entity).catch((err) => 
            console.error(err.response.data)
        );
    })
    .catch((error) => 
        console.error(error.response.data));
}

function errHandler (err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        res.status(401).send({ "Error": "missing or invalid JWT" });
    }
};

function randomString(size) {
    //source: https://futurestud.io/tutorials/generate-a-random-string-in-node-js-or-javascript
    return crypto
      .randomBytes(size)
      .toString('hex')
      .slice(0, size)
}

app.use('/boats', require('./boats.js'), errHandler);
app.use('/loads', require('./loads.js'));
app.use('/users', require('./users.js'));

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});
