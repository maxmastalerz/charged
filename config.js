var express = require('express'),
	path = require('path'),
	fs = require('fs'),
	hogan = require('hogan-express');

module.exports = function(app) {
	app.engine('html', hogan);

	app.configure(function() {
		app.set('port', process.env.PORT || 8080);
		app.set('env', process.env.NODE_ENV || 'development');
		app.set('views', __dirname + '/views');
		app.set('view engine', 'html');

		app.use(express.favicon());
		app.use(express.logger('dev'));
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.cookieParser('your secret goes here'));
		app.use(express.session());
		app.use(app.router);
		app.use(express.static(path.join(__dirname, 'public')));
	});

	app.configure('development', function() {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	app.configure('production', function() {
		app.use(express.errorHandler());
	});

	return this;
};