'use strict';

const fetch = require('node-fetch');

const sendApiUrl = process.env['SEND_API_URL'];
const sendApiKey = process.env['SEND_API_KEY'];

const sendByUuid = (uuid, subject, body, textBody) => {
	const reqBody = {
		transmissionHeader: {
			metadata: {
				userUuid: uuid
			}
		},
		from: {
			address: 'longroom@notice.ft.com',
			name: 'FT Alphaville Long Room'
		},
		subject: subject,
		htmlContent: body,
		plainTextContent: textBody || body
	};
	let options = {
		method: 'POST',
		headers: {
			'Authorization': sendApiKey,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(reqBody)
	};
	return fetch(sendApiUrl, options);
}

module.exports = {
	sendByUuid
}
