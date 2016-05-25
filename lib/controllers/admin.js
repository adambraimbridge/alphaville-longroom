'use strict';

const user = require('../models/user');
const co = require('bluebird').coroutine;

const index = (req, res, next) => {
	co(function *() {
		let pendingUsers = yield user.getUsersByStatus('pending');
		let members = yield user.getUsersByStatus('accepted');
		let rejectedUsers = yield user.getUsersByStatus('rejected');
		return res.render('admin', {pendingUsers, members, rejectedUsers});
	})().catch(next);
};

module.exports = {
	index
};
