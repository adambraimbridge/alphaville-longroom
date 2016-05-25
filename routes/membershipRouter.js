'use strict';

const router = require('express').Router();
const membershipCtrl = require('../lib/controllers/membership');

router.param('uuid', membershipCtrl.params);

router.route('/join').
	get(membershipCtrl.applyForLr);

router.route('/thanks').
	get(membershipCtrl.thanks);

router.route('/approve/:uuid').
	get(membershipCtrl.approve);

router.route('/reject/:uuid').
	get(membershipCtrl.reject);

module.exports = router;
