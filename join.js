var meth = require('./meth.js');
var leave = require('./leave.js');

function connectToRoom(io, client, rooms, newRoom) {
	leave(io, client, rooms);
	client.join(newRoom);
	client.emit('joinedRoom');
	client.emit('updateChat', 'SERVER', '#00FFFF', 'You have joined \'' + newRoom+'\'');
	client.broadcast.to(newRoom).emit('updateChat', 'SERVER', '#00FFFF', client.username + ' has joined this room');
	client.room = newRoom;
	rooms[client.room].players[client.username] = client.id;
	meth.updatePlayersListIn(io, rooms, client.room);
	rooms[newRoom].playerCount = Object.keys(rooms[newRoom].players).length;
	meth.updateRoomLists(io.of("/"), rooms);

	client.bombs = 7;
	client.lives = 3;
	client.emit('updateLives', client.lives);
	client.emit('updateBombs', client.bombs);
	meth.spawn(io.of("/"), rooms, client);
}

module.exports = function(io, client, rooms, newRoom) {
	if(rooms[newRoom].playerCount!=rooms[newRoom].maxPlayers) {
		if(rooms[newRoom].roomPassword!==null) {
			client.emit('roomProtected', newRoom);
			client.on('checkRoomPassword', function(room, passwordInput) {
				if(rooms[room].roomPassword===passwordInput) {
					connectToRoom(io, client, rooms, newRoom);
				} else if(passwordInput!==null) {
					client.emit('roomProtected', newRoom);
				}
			});
		} else {
			connectToRoom(io, client, rooms, newRoom);
		}
	} else {
		client.emit('updateChat', 'SERVER', '#00FFFF', 'You cannot join full rooms!');
	}
}