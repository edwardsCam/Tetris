//------------------------------------------------------------------
//
// This is some dummy score data
//
//------------------------------------------------------------------
var scores = [ {
		id : 0,
		name : 'John Doe',
		score : 1000,
		date : '03-March-2014',
		time : '18:40'
	}, {
		id : 1,
		name : 'Jane Doe',
		score : 2000,
		date : '04-March-2014',
		time : '14:20'
	}],
	nextId = 2;

//------------------------------------------------------------------
//
// Report all scores back to the requester.
//
//------------------------------------------------------------------
exports.all = function(request, response) {
	console.log('find all scores called');
	response.writeHead(200, {'content-type': 'application/json'});
	response.end(JSON.stringify(scores));
};

//------------------------------------------------------------------
//
// Add a new score to the server data.
//
//------------------------------------------------------------------
exports.add = function(request, response) {
	console.log('add new score called');
	console.log('Name: ' + request.query.name);
	console.log('Score: ' + request.query.score);
	
	var now = new Date();
	scores.push( {
		id : nextId,
		name : request.query.name,
		score : request.query.score,
		date : now.toLocaleDateString(),
		time : now.toLocaleTimeString()
	});
	nextId++;
	
	response.writeHead(200);
	response.end();
};
