'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// lib
const path = require('path');

// express dep
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
// db
const mongoose = require('mongoose');

const config = require(`./config`);

// rest api
const restApi = require('iblokz-rest-api');

// init
const app = express();
const db = mongoose.connect(config.db.uri);

console.log('Booyakasha');

// express prefs
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.resolve(__dirname, '../dist')));

// loads the models from json schema
restApi.loadModel(config.rest, db);

// load additional models
require('./models/user');

// auth
require('./api/auth')({app, db, config});

// initis rest endpoints
restApi.initRoutes(app, config.rest, {}, db);

// tasks additional
require('./api/tasks')({app, db, config});
require('./api/projects')({app, db, config});

// migrations
require('./db-migrations/2017-06-29-01')({app, db, config});
require('./db-migrations/2017-07-03-01')({app, db, config});
require('./db-migrations/2017-08-04-01')({app, db, config});

// Logging initialization
app.listen(config.port, () => console.log(`Listening to port ${config.port}`));
