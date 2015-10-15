var m = require('./methods.js');
var leave = require('./leave.js');

function connectToRoom(g, c) {
	leave(g, c);
	c.join(g.newRoom);
	c.emit('joinedRoom');
	c.emit('updateChat', 'SERVER', '#00FFFF', 'You have joined \'' + g.newRoom+'\'');
	c.broadcast.to(g.newRoom).emit('updateChat', 'SERVER', '#00FFFF', c.username + ' has joined this room');
	c.room = g.newRoom;
	g.rooms[c.room].players[c.username] = c.id;
	m.updatePlayersListIn(g, c);
	g.rooms[g.newRoom].playerCount = Object.keys(g.rooms[g.newRoom].players).length;
	m.updateRoomLists(g);

	c.bombs = 7;
	c.wallsInUse = 0;
	c.lives = 3;
	if(g.rooms[c.room].gameMode==='ctf') {
		if(g.rooms[c.room].playerCount%2===0) {
			c.team = 'red';c.colour = '#B20000';
		} else {
			c.team = 'blue';c.colour = '#0000B2';
		}
	}
	c.emit('updateLives', c.lives);
	c.emit('updateBombs', c.bombs);
	c.emit('updateWallsInUse', c.wallsInUse);
	m.spawn(g, c);
}

module.exports = function(g, c) {
	if(g.rooms[g.newRoom].playerCount!=g.rooms[g.newRoom].maxPlayers) {
		if(g.rooms[g.newRoom].roomPassword!==null) {
			c.emit('roomProtected', g.newRoom);
			c.on('checkRoomPassword', function(room, passwordInput) {
				if(g.rooms[room].roomPassword===passwordInput) {
					connectToRoom(g, c);
				} else if(passwordInput!==null) {
					c.emit('roomProtected', g.newRoom);
				}
			});
		} else {
			connectToRoom(g, c);
		}
	} else {
		c.emit('updateChat', 'SERVER', '#00FFFF', 'You cannot join full g.rooms!');
	}
};