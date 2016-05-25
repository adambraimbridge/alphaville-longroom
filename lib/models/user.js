'use strict';

const db = require('../services/db');
const als = require('../services/accessLicenceService');
const session = require('../services/userSessionApi');
const co = require('bluebird').coroutine;



const getUserById = (userId) => {
	return db.oneOrNone('select * from users where user_id = $1', userId);
};

const getUsersByStatus = (status) => {
	return db.any('select * from users where status=$1', status);
};

const addUser = (userId) => {
	return db.task(t => t.oneOrNone('select * from users where user_id = $1', userId).
			then(user => user || t.one('insert into users(user_id) values($1) returning user_id', userId)));
};

const applyForLr = (userId) => {
	return addUser(userId);
};

const updateUserStatus = (newStatus, userId) => {
	return db.one('update users set status = $1 where user_id = $2 returning user_id', [newStatus, userId]);
};

const approve = (userId) => {
	return co(function *() {
		let licence = yield als.create(userId);
		let allocateUser = yield als.allocate(licence.id, userId);
		let setApproved = yield updateUserStatus('accepted', userId);
	})().catch(console.log);
};

const reject = (userId) => {
	return updateUserStatus('rejected', userId);
};

module.exports = {
	getUserById,
	applyForLr,
	approve,
	reject,
	getUsersByStatus
};
