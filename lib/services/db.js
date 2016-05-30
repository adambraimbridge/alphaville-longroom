'use strict';

const Promise = require('bluebird');
const dbOptions = {
	promiseLib: Promise
};
const pgp = require('pg-promise')(dbOptions);
const connectionString = process.env['DATABASE_URL'] + (process.env['DATABASE_SSL'] === 'true' ? '?ssl=true' : '');
const db = pgp(connectionString);

module.exports = db;
