'use strict';

const router = require('express').Router();
const auth = require('alphaville-auth-middleware');
const lrUserMiddleware = require('./middlewares/lrUserMiddleware');

router.use('/', auth());
router.use('/', lrUserMiddleware);

router.get('/', (req, res, next) => {
	res.render('index', {
		title: 'Long Room',
		subtitle: 'In depth comment and analysis'
	});
});

router.use('/create', require('./routes/discussionsRouter'));
router.use('/membership', require('./routes/membershipRouter'));
router.use('/admin', require('./routes/adminRouter'));

module.exports = router;
