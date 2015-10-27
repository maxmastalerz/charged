var m = require('./methods.js');
var leave = require('./leave.js');
var Bot = require('./botCreator.js');

function connectToRoom(g, c, room) {
	if(c.room!==undefined) {
		leave(g, c);
	}
	c.join(room);
	c.emit('joinedRoom');
	c.emit('updateChat', 'SERVER', '#00FFFF', 'You have joined \'' + room+'\'');
	c.broadcast.to(room).emit('updateChat', 'SERVER', '#00FFFF', c.username + ' has joined this room');
	c.room = room;
	g.rooms[room].players[c.username] = c.id;
	m.updatePlayersListIn(g, room);
	g.rooms[room].playerCount = Object.keys(g.rooms[room].players).length;
	m.updateRoomLists(g);

	c.bombs = 7;
	c.wallsInUse = 0;
	c.lives = 3;
	c.carryingFlag = undefined;
	if(g.rooms[room].gameMode==='ctf') {
		if(g.rooms[room].redPlayers>g.rooms[room].bluePlayers) {
			c.team = 'blue'; c.colour = '#0000B2'; g.rooms[room].bluePlayers++;
		} else {
			c.team = 'red'; c.colour = '#B20000'; g.rooms[room].redPlayers++;
		}
		c.emit('updateScore', g.rooms[room].redScore, g.rooms[room].blueScore);
	} else {
		c.colour = m.getRandColour();
	}
	/*if(g.rooms[room].gameMode==='hvb' && c.isBot===false) {
		connectToRoom()
	}*/
	c.emit('updateLives', c.lives);
	c.emit('updateBombs', c.bombs);
	c.emit('updateWallsInUse', c.wallsInUse);
	c.emit('updateColour', c.colour);
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