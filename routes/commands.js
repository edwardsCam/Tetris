var controls = [ {
		name : 'left',
		key : 65
	}, {
		name : 'right',
		key : 68
	}, {
		name : 'counterclock',
		key : 81
	},{
		name : 'clock',
		key : 69
	},{
		name : 'soft',
		key : 83
	}, {
		name : 'hard',
		key : 87
	}];

//------------------------------------------------------------------
//
// Report all controls back to the requester.
//
//------------------------------------------------------------------
exports.all = function(request, response) {
	console.log('find all controls called');
	response.writeHead(200, {'content-type': 'application/json'});
	response.end(JSON.stringify(controls));
};

//------------------------------------------------------------------
//
// Add a new control to the server data.
//
//------------------------------------------------------------------
exports.add = function(request, response) {
	console.log('add new control called');
	console.log('Name: ' + request.query.name);
	console.log('key: ' + request.query.key);
	
	controls.push( {
		name : request.query.name,
		key : request.query.key,
	});
	
	response.writeHead(200);
	response.end();
};

exports.put = function(request, response) {
	console.log('put new control called');
	console.log('Name: ' + request.query.name);
	console.log('key: ' + request.query.key);
	
	for (var i = 0; i < 6; i++) {
		if (controls[i].name == request.query.name) {
			controls[i].key = request.query.key;
			break;
		}
	}
	
	response.writeHead(200);
	response.end();
};
