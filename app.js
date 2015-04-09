var express = require('express'),
	http = require('http'),
	path = require('path'),
	scores = require('./routes/scores'),
	controls = require('./routes/commands'),
	app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.engine('html', require('ejs').renderFile);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(__dirname + 'views'));
app.use('/scripts', express.static(__dirname + '/scripts'));

//development only
if ('development' === app.get('env')) {
	app.use(express.errorHandler());
}

//------------------------------------------------------------------
//
// Define the different routes we support
//
//------------------------------------------------------------------
app.get('/', function(request, response) {
	response.render('index.html');
});

app.get('/v1/high-scores', scores.all);
app.post('/v1/high-scores', scores.add);

app.get('/v1/controls', controls.all);
app.post('/v1/controls', controls.add);
app.put('/v1/controls', controls.put);


//------------------------------------------------------------------
//
// Indicate any other api requests are not implemented
//
//------------------------------------------------------------------
app.all('/v1/*', function(request, response) {
	response.writeHead(501);
	response.end();
});

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
