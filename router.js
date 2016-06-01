'use strict';

const router = require('express').Router();
const auth = require('alphaville-auth-middleware');
const userMiddleware = require('./lib/middlewares/user');

router.use('/', auth());
router.use('/', userMiddleware);

router.use('/', require('./routes/index'));
router.use('/', require('./routes/discussionsRouter'));
router.use('/admin', require('./routes/adminRouter'));
router.use('/membership', require('./routes/membershipRouter'));

module.exports = router;
