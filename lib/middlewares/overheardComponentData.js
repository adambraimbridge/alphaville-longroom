const recentCommentsApi = require('../services/recentComments');
const _ = require('lodash');
const striptags = require('striptags');
const cache = require('memory-cache');

module.exports = function (req, res, next) {
	let promise;

	if (cache.get('overheardData')) {
		promise = Promise.resolve(cache.get('overheardData'));
	} else {
		promise = recentCommentsApi.get()
			.then(recentComments => recentComments.map(comment => {
				comment.bodyHtml = _.truncate(striptags(comment.bodyHtml), {length: 100, 'separator': ' '});
				comment.commentsArticleId = comment.articleId;
				comment.articleId = comment.articleId.replace('longroom', '');

				return comment;
			}))
			.then(recentComments => {
				cache.put('overheardData', recentComments, 10 * 60 * 1000); // 10 minutes

				return recentComments;
			})
			.catch(err => {
				console.log('Failed to fetch recent comments', err);

				return [];
			});
	}



	promise.then(overheardData => {
		const _render = res.render;
		res.render = function( view, options, fn ) {
			options = options || {};

			_.merge(options, {
				overheardData: overheardData,
				overheardVisible: !process.env.OVERHEARD_HIDDEN
			});

			_render.call(this, view, options, fn);
		};
		next();
	});
};
