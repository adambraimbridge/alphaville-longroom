'use strict';

const session = require('../lib/services/userSessionApi');

module.exports = (req, res, next) => {
	let sessionId = req.cookies['FTSession'];
	if ( !sessionId ) {
		return next(new Error('Invalid session id'));
	}
	session.getSessionData(sessionId).then(sessionData => {
		req.sessionData = sessionData;
		return next();
	}).catch(next);
};
