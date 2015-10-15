var meth = require('./meth.js');
var leave = require('./leave.js');

function connectToRoom(io, cli, rooms, newRoom) {
	leave(io, cli, rooms);
	cli.join(newRoom);
	cli.emit('joinedRoom');
	cli.emit('updateChat', 'SERVER', '#00FFFF', 'You have joined \'' + newRoom+'\'');
	cli.broadcast.to(newRoom).emit('updateChat', 'SERVER', '#00FFFF', cli.username + ' has joined this room');
	cli.room = newRoom;
	rooms[cli.room].players[cli.username] = cli.id;
	meth.updatePlayersListIn(io, rooms, cli.room);
	rooms[newRoom].playerCount = Object.keys(rooms[newRoom].players).length;
	meth.updateRoomLists(io.of("/"), rooms);

	cli.bombs = 7;
	cli.wallsInUse = 0;
	cli.lives = 3;
	if(rooms[cli.room].gameMode==='ctf') {
		if(rooms[cli.room].playerCount%2===0) {
			cli.team = 'red';cli.colour = '#B20000';
		} else {
			cli.team = 'blue';cli.colour = '#0000B2';
		}
	}
	cli.emit('updateLives', cli.lives);
	cli.emit('updateBombs', cli.bombs);
	cli.emit('updateWallsInUse', cli.wallsInUse);
	meth.spawn(io.of("/"), rooms, cli);
}

module.exports = function(io, cli, rooms, newRoom) {
	if(rooms[newRoom].playerCount!=rooms[newRoom].maxPlayers) {
		if(rooms[newRoom].roomPassword!==null) {
			cli.emit('roomProtected', newRoom);
			cli.on('checkRoomPassword', function(room, passwordInput) {
				if(rooms[room].roomPassword===passwordInput) {
					connectToRoom(io, cli, rooms, newRoom);
				} else if(passwordInput!==null) {
					cli.emit('roomProtected', newRoom);
				}
			});
		} else {
			connectToRoom(io, cli, rooms, newRoom);
		}
	} else {
		cli.emit('updateChat', 'SERVER', '#00FFFF', 'You cannot join full rooms!');
	}
}