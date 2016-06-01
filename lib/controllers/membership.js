'use strict';

const user = require('../models/user');
const co = require('bluebird').coroutine;
const uuid = require('uuid');

const params = (req, res, next, uuid) => {
	co(function *() {
		let lrUser = yield user.getUserById(uuid);
		if ( !user ) {
			return Promise.reject(new Error('User not found'));
		}
		req.user = lrUser;
		return next();
	})().catch(next);
};

const applyForLr = (req, res, next) => {
	let userId;
	try {
		userId = req.userUuid;
	} catch(e) {
		return next(e);
	}
	user.applyForLr(userId).
		then(user => {
			res.redirect('thanks');
		}).
		catch(next);
};

const approve = (req, res, next) => {
	let userId = req.user.user_id;
	return user.approve(userId).then(() => res.redirect('back')).catch(next);
};

const reject = (req, res, next) => {
	let userId = req.user.user_id;
	return user.reject(userId).then(() => res.redirect('back')).catch(next);
};

const thanks = (req, res, next) => {
	res.render('thanks');
};

module.exports = {
	applyForLr,
	params,
	thanks,
	approve,
	reject
};
