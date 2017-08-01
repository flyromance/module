var express = require('express');

var app = express();

app.static();

app.listen(8080, function () {
	console.log('server start on ' + 8080 + "...");
});