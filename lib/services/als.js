const fetch = require('node-fetch');

const alsKey = process.env['ALS_KEY'];
const alsUrl = process.env['ALS_URL'];

function AlsError(msg, code, response) {
	this.statusText = msg;
	this.message = msg;
	this.errMsg = msg;

	this.code = code;
	this.errCode = code;
	this.status = code;

	this.response = response;
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
	const options = Object.assign({}, alsOptions, {
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
		if ( res.status !== 201 ) {
			throw new AlsError(res.statusText, res.status, res);
		}
		return res.json();
	});
};

const allocate = (licenceId, userId) => {
	const options = Object.assign({}, alsOptions, {
		method: 'POST',
		body: JSON.stringify({
			userId
		})
	});
	return fetch(`${alsUrl}${licenceId}/seats/allocate`, options)
		.then(res => {
			if ( res.status !== 201 ) {
				throw new AlsError(res.statusText, res.status, res);
			}
		});
};

const getLrLicence = (userId, licenceStatus) => {
	licenceStatus = licenceStatus || 'active';
	return fetch(`${alsUrl}?userid=${userId}`, alsOptions)
		.then(res => {
			if (!res.ok) {
				throw new AlsError(res.statusText, res.status, res);
			}
			return res.json();
		})
		.then(({accessLicences}) => accessLicences.filter(({status}) => status === licenceStatus))
		.then(activeLicences => {
			let lrLicence = null;
			activeLicences.forEach(licence => {
				licence.products.forEach(product => {
					if (product.code === 'L1') {
						lrLicence = licence;
					}
				});
			});
			return lrLicence;
		});
};

const suspend = (licenceId) => {
	const options = Object.assign({}, alsOptions, {
		method: 'POST'
	});
	return fetch(`${alsUrl}${licenceId}/suspend`, options)
		.then(res => {
			if (!res.ok) {
				throw new AlsError(res.statusText, res.status, res);
			}
		});
};

const revoke = (licenceId) => {
	const options = Object.assign({}, alsOptions, {
		method: 'POST'
	});
	return fetch(`${alsUrl}${licenceId}/revoke`, options)
		.then(res => {
			if (!res.ok) {
				throw new AlsError(res.statusText, res.status, res);
			}
		});
};

const reinstate = (licenceId) => {
	const options = Object.assign({}, alsOptions, {
		method: 'POST'
	});
	return fetch(`${alsUrl}${licenceId}/reinstate`, options)
		.then(res => {
			if (!res.ok) {
				throw new AlsError(res.statusText, res.status);
			}
		});
};

module.exports = {
	create,
	allocate,
	suspend,
	revoke,
	reinstate,
	getLrLicence
};
