var m = require('./methods.js');
var leave = require('./leave.js');

function connectToRoom(g, c, room) {
	if(c.room!==undefined) {
		leave(g, c);
	}
	c.join(room);
	c.emit('joinedRoom');
	c.emit('updateChat', 'SERVER', '#00FFFF', 'You have joined \'' + room+'\'');
	c.broadcast.to(room).emit('updateChat', 'SERVER', '#00FFFF', c.username + ' has joined this room');
	c.room = room;
	g.rooms[c.room].players[c.username] = c.id;
	m.updatePlayersListIn(g, c.room);
	g.rooms[room].playerCount = Object.keys(g.rooms[room].players).length;
	m.updateRoomLists(g);

	c.bombs = 7;
	c.wallsInUse = 0;
	c.lives = 3;
	c.carryingFlag = undefined;
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

module.exports = function(g, c, room) {
	if(g.rooms[room].playerCount!=g.rooms[room].maxPlayers) {
		if(g.rooms[room].roomPassword!==null) {
			c.emit('roomProtected', room);
			c.on('checkRoomPassword', function(room, passwordInput) {
				if(g.rooms[room].roomPassword===passwordInput) {
					connectToRoom(g, c);
				} else if(passwordInput!==null) {
					c.emit('roomProtected', room);
				}
			});
		} else {
			connectToRoom(g, c, room);
		}
	} else {
		c.emit('updateChat', 'SERVER', '#00FFFF', 'You cannot join full g.rooms!');
	}
};