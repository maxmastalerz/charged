var i = {			//Includes
	http: 			require('http'),
	socket: 		require('socket.io'),
	app: 			require('express')(),
	leave: 			require('./leave.js'),
	move: 			require('./move.js'),
	join: 			require('./join.js'),
	create: 		require('./roomCreator.js'),
	bombPlacement: 	require('./bombPlacement.js'),
	wallPlacement: 	require('./wallPlacement.js')
};
require('./express-routes.js')(i.app);
require('./config.js')(i.app);

var m = require('./methods.js');

var s = i.http.createServer(i.app).listen(i.app.get('port'), function() {
	console.log('Express server @ localhost:' + i.app.get('port') + '/ under ' + i.app.get('env') + ' environment');
});

var g = {			//Global game data
	io: i.socket.listen(s),
	rooms: {}
};

g.io.sockets.on('connection', function(c) {
	c.room = null;
	c.username = m.generateUsername(g, c);
	m.updateRoomLists(g);

	c.on('placeBomb', function() {
		i.bombPlacement(g, c);
	});
	c.on('placeWall', function() {
		i.wallPlacement(g, c);
	});
	c.on('createRoom', function(room, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay, roomPassword) {
		i.create(g, c, room, maxPlayers, gameMode, mapSize, mapVisibility, bombDelay, roomPassword);
	});
	c.on('clearDebris', function() {
		m.updateMiniMapsInYourRoom(g, c);
	});
	c.on('changeName', function(newName) {
		m.changeName(g, c, newName);
	});
	c.on('switchRoom', function(newRoom) {
		i.join(g, c, newRoom);
	});
	c.on('disconnect', function() {
		i.leave(g, c);
	});
	c.on('returnToMenu', function() {
		i.leave(g, c);
	});

	var timesPerSecond, distTraveledX, distTraveledY;
	setInterval(function() {
		if(timesPerSecond>18 || distTraveledY>9 || distTraveledX>9) {
			i.leave(g, c);
			c.emit('errorMessage', 'You have been kicked for hacking!');
		}
		timesPerSecond = distTraveledX = distTraveledY = 0;
	}, 1000);
	c.on('move', function(deltaX, deltaY) {
		if(deltaX!==0) { distTraveledX++; }
		if(deltaY!==0) { distTraveledY++; }
		timesPerSecond++;
		i.move(g, c, deltaX, deltaY);
	});
	c.on('sendchat', function(message) {
		message = m.sanitizeInput(message.replace(/\s+/g,' ')).trim();
		if(message!==null && message!=='' && !(/^\s+$/.test(message))) {
			g.io.sockets.in(c.room).emit('updateChat', c.username, c.colour, message);
		}
	});
 });