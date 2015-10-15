var m = require('./methods.js');

function removeFromPlayerList(g, c) {
	for(var player in g.rooms[c.room].players) {
		if(player==c.username) {
			delete g.rooms[c.room].players[player];
			m.updatePlayersListIn(g, c);
		}
	}
}

function deleteRoomIfEmpty(g, c) {
	g.rooms[c.room].playerCount = Object.keys(g.rooms[c.room].players).length;
	if(g.rooms[c.room].playerCount===0) {
		delete g.rooms[c.room];
	}
}

module.exports = function(g, c) {
	if(c.room!==null) {
		g.rooms[c.room].map[c.yPos][c.xPos] = {type: 'air'};
		m.updateMiniMapsInYourRoom(g, c);

		removeFromPlayerList(g, c);

		c.leave(c.room);
		c.emit('leftRoom');
		c.broadcast.to(c.room).emit('updateChat', 'SERVER', '#00FFFF', c.username+' chose to leave');

		deleteRoomIfEmpty(g, c);
		c.room = null;
		m.updateRoomLists(g);
	}
};