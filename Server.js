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

var server = http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server @ localhost:' + app.get('port') + '/ under ' + app.get('env') + ' environment');
});

var rooms = {};

var io = socket.listen(server);

io.sockets.on('connection', function(client) {
	client.room = null;
	client.username = meth.generateUsername(io, client);
	meth.updateRoomLists(io.of("/"), rooms);

	client.on('placeBomb', function() {
		bombPlacement(io, client, rooms);
	});
	client.on('placeWall', function() {
		wallPlacement(io, client, rooms);
	});
	client.on('createRoom', function(room, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay, roomPassword) {
		create(io, client, rooms, room, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay, roomPassword);
	});
	client.on('clearDebris', function() {
		meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);
	});
	client.on('changeName', function(newName) {
		meth.changeName(io, client, rooms, newName);
	});
	client.on('switchRoom', function(newRoom) {
		join(io, client, rooms, newRoom);
	});
	client.on('disconnect', function() {
		leave(io, client, rooms);
	});
	client.on('returnToMenu', function() {
		leave(io, client, rooms);
	});

	var timesPerSecond, distTraveledX, distTraveledY;
	setInterval(function() {
		if(timesPerSecond>18 || distTraveledY>9 || distTraveledX>9) {
			leave(io, client, rooms);
			client.emit('errorMessage', 'You have been kicked for hacking!');
		}
		timesPerSecond = distTraveledX = distTraveledY = 0;
	}, 1000);
	client.on('move', function(deltaX, deltaY) {
		if(deltaX!==0) { distTraveledX++; }
		if(deltaY!==0) { distTraveledY++; }
		timesPerSecond++;
		move(io, client, rooms, deltaX, deltaY);
	});
	client.on('sendchat', function(message) {
		message = meth.sanitizeInput(message.replace(/\s+/g,' ')).trim();
		if(message!==null && message!=='' && !(/^\s+$/.test(message))) {
			io.sockets.in(client.room).emit('updateChat', client.username, client.colour, message);
		}
	});
 });