'use strict';

const router = require('express').Router();
const auth = require('alphaville-auth-middleware');

router.use('/', auth());

router.use('/', require('./routes/index'));
router.use('/', require('./routes/discussionsRouter'));
router.use('/admin', require('./routes/adminRouter'));
router.use('/membership', require('./routes/membershipRouter'));

module.exports = router;
