'use strict';

const router = require('express').Router();
const adminCtrl = require('../lib/controllers/admin');
const s3o = require('s3o-middleware');

router.use(s3o);
router.route('/').
	get(adminCtrl.index);


module.exports = router;
