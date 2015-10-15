var express 		= require('express'),
	http 			= require('http'),
	mongoose 		= require('mongoose'),
	socket 			= require('socket.io');

var app = module.exports = express();
var config = require('./config.js')(app);
var leave = require('./leave.js');
var move = require('./move.js');
var join = require('./join.js');
var create = require('./roomCreator.js');
var bombPlacement = require('./bombPlacement.js');
var wallPlacement = require('./wallPlacement.js');
var meth = require('./meth.js');	//IMPORTANT! METHODS MUST BE LOADED LAST!
require('./express-routes.js')(app);

if(config.connectToMongoDB) {
	mongoose.connect(config.db);
	console.log('Connected to '+config.db);
}

var srv = http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server @ localhost:' + app.get('port') + '/ under ' + app.get('env') + ' environment');
});

var rooms = {};

var io = socket.listen(srv);

io.sockets.on('connection', function(cli) {
	cli.room = null;
	cli.username = meth.generateUsername(io, cli);
	meth.updateRoomLists(io.of("/"), rooms);

	cli.on('placeBomb', function() {
		bombPlacement(io, cli, rooms);
	});
	cli.on('placeWall', function() {
		wallPlacement(io, cli, rooms);
	});
	cli.on('createRoom', function(room, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay, roomPassword) {
		create(io, cli, rooms, room, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay, roomPassword);
	});
	cli.on('clearDebris', function() {
		meth.updateMiniMapsInYourRoom(io.of("/"), rooms, cli);
	});
	cli.on('changeName', function(newName) {
		meth.changeName(io, cli, rooms, newName);
	});
	cli.on('switchRoom', function(newRoom) {
		join(io, cli, rooms, newRoom);
	});
	cli.on('disconnect', function() {
		leave(io, cli, rooms);
	});
	cli.on('returnToMenu', function() {
		leave(io, cli, rooms);
	});

	var timesPerSecond, distTraveledX, distTraveledY;
	setInterval(function() {
		if(timesPerSecond>18 || distTraveledY>9 || distTraveledX>9) {
			leave(io, cli, rooms);
			cli.emit('errorMessage', 'You have been kicked for hacking!');
		}
		timesPerSecond = distTraveledX = distTraveledY = 0;
	}, 1000);
	cli.on('move', function(deltaX, deltaY) {
		if(deltaX!==0) { distTraveledX++; }
		if(deltaY!==0) { distTraveledY++; }
		timesPerSecond++;
		move(io, cli, rooms, deltaX, deltaY);
	});
	cli.on('sendchat', function(message) {
		message = meth.sanitizeInput(message.replace(/\s+/g,' ')).trim();
		if(message!==null && message!=='' && !(/^\s+$/.test(message))) {
			io.sockets.in(cli.room).emit('updateChat', cli.username, cli.colour, message);
		}
	});
 });