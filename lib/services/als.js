const fetch = require('node-fetch');

const alsKey = process.env['ALS_KEY'];
const alsUrl = process.env['ALS_URL'];

function AlsError(msg, code) {
	this.errMsg = msg;
	this.errCode = code;
}

AlsError.prototype = new Error('AlsError');

const alsOptions = {
	method: 'GET',
	headers: {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': alsKey
	}
};

const create = (userId) => {
	let options = Object.assign(alsOptions, {
		method: 'POST',
		body: JSON.stringify({
			"links" : [ {
				"rel" : "longroom",
				"href" : "http://ftalphaville.ft.com/longroom/admin",
				"id" : `AV2-Longroom-${userId}`
			} ],
			"issueReason" : "Longroom Application Approved",
			"products" : [ {
				"code" : "L1",
				"name" : "Longroom"
			} ],
			"seatLimit" : 1,
			"ipAccessEnabled" : false,
			"ipAccessAddresses" : null
		})
	});
	return fetch(alsUrl, options).then(res => {
		if ( res.status != 201 ) {
			throw new AlsError(res.statusText, res.status);
		}
		return res.json();
	});
};

const allocate = (licenceId, userId) => {
	let options = Object.assign(alsOptions, {
		method: 'POST',
		body: JSON.stringify({
			userId
		})
	});
	return fetch(`${alsUrl}${licenceId}/seats/allocate`, options)
		.then(res => {
			if ( res.status != 201 ) {
				throw new AlsError(res.statusText, res.status);
			}
		});
};

module.exports = {
	create,
	allocate
};