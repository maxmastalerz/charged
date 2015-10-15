var meth = require('./meth.js');

function removeFromPlayerList(io, cli, rooms) {
	for(var player in rooms[cli.room].players) {
		if(player==cli.username) {
			delete rooms[cli.room].players[player];
			meth.updatePlayersListIn(io, rooms, cli.room);
		}
	}
}

function deleteRoomIfEmpty(cli, rooms) {
	rooms[cli.room].playerCount = Object.keys(rooms[cli.room].players).length;
	if(rooms[cli.room].playerCount===0) {
		delete rooms[cli.room];
	}
}

module.exports = function(io, cli, rooms) {
	if(cli.room!==null) {
		rooms[cli.room].map[cli.yPos][cli.xPos] = {type: 'air'};
		meth.updateMiniMapsInYourRoom(io.of("/"), rooms, cli);

		removeFromPlayerList(io, cli, rooms);

		cli.leave(cli.room);
		cli.emit('leftRoom');
		cli.broadcast.to(cli.room).emit('updateChat', 'SERVER', '#00FFFF', cli.username+' chose to leave');

		deleteRoomIfEmpty(cli, rooms);
		cli.room = null;
		meth.updateRoomLists(io.of("/"), rooms);
	}
};