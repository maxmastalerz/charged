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
	client.on('createRoom', function(room, maxPlayers, mapSize, mapVisibility, bombDelay, roomPassword) {
		create(io, client, rooms, room, maxPlayers, mapSize, mapVisibility, bombDelay, roomPassword);
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
	client.on('move', function(deltaX, deltaY) {
		move(io, client, rooms, deltaX, deltaY);
	});
	client.on('sendchat', function(message) {
		message = meth.sanitizeInput(message.replace(/\s+/g,' ')).trim();
		if(message!==null && message!=='' && !(/^\s+$/.test(message))) {
			io.sockets.in(client.room).emit('updateChat', client.username, client.colour, message);
		}
	});
 });