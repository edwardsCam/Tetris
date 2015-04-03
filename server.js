var http = require('http'),
	path = require('path'),
	url = require('url'),
	fs = require('fs'),
	mimeTypes = {
		'.js' : 'text/javascript',
		'.html' : 'text/html',
		'.css' : 'text/css'
	};

http.createServer(function(request, response) {
	var lookup = (request.url === '/') ? '/index.html' : decodeURI(request.url),
		file;
	file = lookup.substring(1, lookup.length);
	fs.exists(file, function(exists) {
		console.log(exists ? lookup + ' is there' : lookup + ' doesn\'t exist');
		if (exists) {
			fs.readFile(file, function(err, data) {
				if (err) {
					response.writeHead(500);
					response.end('Server Error!');
				}
				else {
					var headers = {'Content-type': mimeTypes[path.extname(lookup)]};
					response.writeHead(200, headers);
					response.end(data);
				}
			});
		}
		else {
			response.writeHead(404);
			response.end();
		}
	});
}).listen(3000);
