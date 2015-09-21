var meth = require('./meth.js');

function removeFromPlayerList(io, client, rooms) {
	for(var player in rooms[client.room].players) {
		if(player==client.username) {
			delete rooms[client.room].players[player];
			meth.updatePlayersListIn(io, rooms, client.room);
		}
	}
}

function deleteRoomIfEmpty(client, rooms) {
	rooms[client.room].playerCount = Object.keys(rooms[client.room].players).length;
	if(rooms[client.room].playerCount===0) {
		delete rooms[client.room];
	}
}

module.exports = function(io, client, rooms) {
	if(client.room!==null) {
		rooms[client.room].map[client.yPos][client.xPos] = '0';
		meth.updateMiniMapsInYourRoom(io.of("/"), rooms, client);

		removeFromPlayerList(io, client, rooms);

		client.leave(client.room);
		client.emit('leftRoom');
		client.broadcast.to(client.room).emit('updateChat', 'SERVER', '#00FFFF', client.username+' chose to leave');

		deleteRoomIfEmpty(client, rooms);
		client.room = null;
		meth.updateRoomLists(io.of("/"), rooms);
	}
};