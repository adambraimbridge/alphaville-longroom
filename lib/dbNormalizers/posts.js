const objectInArray = require('../utils/objectInArray');
const _ = require('lodash');
const fileTypes = require('../utils/fileTypes');
const commentsApi = require('../services/commentsApi');
const temporaryDisplayNameApi = require('../services/temporaryDisplayNameApi');
const sanitizeHtml = require('sanitize-html');
const entities = require('entities');

const moment = require('moment-timezone');
moment.tz.setDefault("Europe/London");

exports.flatten = function (dbResults) {
	if (dbResults && !dbResults.length)	 {
		return [];
	}

	const normalizedPosts = {};
	const postsArr = [];

	dbResults.forEach(post => {
		if (!normalizedPosts[post.id]) {
			normalizedPosts[post.id] = _.pick(post, ['id', 'title', 'summary', 'post_type', 'user_id', 'user_summary', 'published', 'created_at', 'published_at']);
			normalizedPosts[post.id].tags = [];
			normalizedPosts[post.id].files = [];

			postsArr.push(normalizedPosts[post.id]);
		}

		const currentPost = normalizedPosts[post.id];

		currentPost.title = sanitizeHtml(currentPost.title, {
			allowedTags: [],
			allowedAttributes: [],
			parser: {
				decodeEntities: true
			}
		});
		currentPost.title = entities.decodeHTML(currentPost.title);

		if (currentPost.user_summary) {
			currentPost.user_summary = sanitizeHtml(currentPost.user_summary, {
				allowedTags: [],
				allowedAttributes: []
			});
			currentPost.user_summary = entities.decodeHTML(currentPost.user_summary);
		}

		if (currentPost.summary) {
			currentPost.summary = sanitizeHtml(currentPost.summary, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'span']),
				allowedAttributes: Object.assign({}, sanitizeHtml.defaults.allowedAttributes, {
					img: ['src', 'title', 'width', 'height'],
					'*': ['class']
				})
			});
		}

		if (post.tag_name) {
			if (!objectInArray.isObjectInArray(currentPost.tags, {
				value: post.tag_id,
				key: 'id'
			})) {
				sanitizeHtml(post.tag_name, {
					allowedTags: [],
					allowedAttributes: [],
					parser: {
						decodeEntities: true
					}
				});
				post.tag_name = entities.decodeHTML(post.tag_name);

				currentPost.tags.push({
					id: post.tag_id,
					name: post.tag_name,
					index: post.tag_index
				});
			}
		}

		if (post.file_name) {
			if (!objectInArray.isObjectInArray(currentPost.files, [
				{
					value: post.file_id,
					key: 'id'
				},
				{
					value: post.file_name,
					key: 'name'
				},
				{
					value: post.file_size,
					key: 'size'
				},
				{
					value: post.file_ext,
					key: 'ext'
				},
				{
					value: post.file_source,
					key: 'source'
				}
			])) {
				let isSourceIdenticalWithFileName = false;

				if (post.file_name.replace('.' + post.file_ext, '') === post.file_source) {
					isSourceIdenticalWithFileName = true;
				}

				sanitizeHtml(post.file_source, {
					allowedTags: [],
					allowedAttributes: [],
					parser: {
						decodeEntities: true
					}
				});
				post.file_source = entities.decodeHTML(post.file_source);

				currentPost.files.unshift({
					id: post.file_id,
					name: post.file_name,
					size: post.file_size,
					ext: post.file_ext,
					source: post.file_source,
					fileNameVisible: !isSourceIdenticalWithFileName,
					iconName: fileTypes.icons[post.file_ext] || "generic"
				});
			}
		}


		currentPost.dataForShare = {
			id: 'longroom' + currentPost.id,
			comments: {
				enabled: true
			},
			webUrl: process.env.APP_URL + '/content/' + currentPost.id
		};

		currentPost.comments = {
			enabled: true
		};

		currentPost.webUrl = process.env.APP_URL + '/content/' + currentPost.id;
	});

	postsArr.forEach(post => {
		post.tags.sort((a, b) => {
			if (a.index > b.index) {
				return 1;
			}

			if (a.index < b.index) {
				return -1;
			}

			return 0;
		});

		if (post.tags.length) {
			post.primaryTag = _.omit(post.tags[0], ['index']);
		}
	});

	return postsArr || [];
};

exports.enrichWithPseudonyms = async function (posts) {
	if (!posts.length) {
		return Promise.resolve(posts);
	}

	const userIds = [];
	posts.forEach(post => {
		if (userIds.indexOf(post.user_id) === -1) {
			userIds.push(post.user_id);
		}
	});

	if (!userIds.length) {
		return Promise.resolve(posts);
	}

	const commentsUsers = await commentsApi.getMultipleUsers(userIds);

	await Promise.all(posts.map(async (post) => {
		if (!post.user) {
			post.user = {};
		}

		if (commentsUsers[post.user_id] && commentsUsers[post.user_id].displayName) {
			post.user.pseudonym = commentsUsers[post.user_id].displayName;
		} else {
			post.user.pseudonym = (await temporaryDisplayNameApi.getByUserId(post.user_id)) || '-';
		}
	}));

	return posts;
};

exports.groupByTime = function (posts) {
	const timeCategories = [
		{
			label: 'Today',
			match: date => {
				const today = moment(new Date());
				date = moment(date);

				return (date.year() === today.year()
						&& date.dayOfYear() === today.dayOfYear());
			},
			date: new Date().toISOString(),
			items: []
		},
		{
			label: 'This week',
			match: date => {
				date = moment(date);
				const today = moment(new Date());
				const startOfWeek = moment().startOf('week').add(1, 'day');

				return (startOfWeek.isBefore(date) && today.isAfter(date));
			},
			items: []
		},
		{
			label: 'Last week',
			match: date => {
				date = moment(date);
				const startOfLastWeek = moment().startOf('week').subtract(6, 'day');
				const endOfLastWeek = moment().endOf('week').subtract(6, 'day');

				return (startOfLastWeek.isBefore(date) && endOfLastWeek.isAfter(date));
			},
			items: []
		},
		{
			label: 'This month',
			match: date => {
				date = moment(date);
				const startOfThisMonth = moment().startOf('month');
				const endOfThisMonth = moment().endOf('month');

				return (startOfThisMonth.isBefore(date) && endOfThisMonth.isAfter(date));
			},
			items: []
		},
		{
			label: 'Last month',
			match: date => {
				date = moment(date);
				const startOfLastMonth = moment().startOf('month').subtract(1, 'month');
				const endOfLastMonth = moment().endOf('month').subtract(1, 'month');

				return (startOfLastMonth.isBefore(date) && endOfLastMonth.isAfter(date));
			},
			items: []
		},
		{
			label: 'Older',
			match: () => {
				return true;
			},
			items: []
		}
	];

	let currentTimeCategory = 0;
	posts.forEach((post) => {
		while (!timeCategories[currentTimeCategory].match(new Date(post.published_at))) {
			currentTimeCategory++;
		}

		timeCategories[currentTimeCategory].items.push(post);
	});


	const results = [];
	let categoryIndex = 0;
	timeCategories.forEach((timeCategory) => {
		if (timeCategory.items.length) {
			categoryIndex++;
			const obj = _.pick(timeCategory, ['label', 'items', 'date']);

			results.push(obj);
		}
	});

	return results;
};


exports.setAdMarkers = function (posts) {
	let index = 0;
	posts.forEach((item) => {
		if (item) {
			if (item.items) {
				item.items.forEach((article) => {
					if (index === 4) {
						article.mobileAdAfter = 1;
					}

					if (index === 10) {
						article.mobileAdAfter = 2;
						article.tabletAdAfter = 1;
					}

					index++;
				});
			} else {
				if (index === 4) {
					item.mobileAdAfter = 1;
				}

				if (index === 10) {
					item.mobileAdAfter = 2;
					item.tabletAdAfter = 1;
				}

				index++;
			}
		}
	});

	return posts;
};

exports.editAndDeleteFlag = function (posts, userData) {
	posts.forEach(post => {
		if (userData && (userData.user_id === post.user_id || userData.is_editor)) {
			post.editAndDelete = true;
		}
	});

	return posts;
};
