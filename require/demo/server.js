var express = require('express');
var ejs = require('ejs');

var app = express();

app.use(express.static('./public'));

app.set('views', './view');
app.engine('html', require('ejs').renderFile);

app.get('/', function (req, res) {
	res.render('page1', {
		
	})
})

app.listen(8080, function () {
	console.log('server start on ' + 8080 + "...");
});