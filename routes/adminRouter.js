'use strict';

const router = require('express').Router();
const adminCtrl = require('../lib/controllers/admin');

router.route('/').
	get(adminCtrl.index);


module.exports = router;
